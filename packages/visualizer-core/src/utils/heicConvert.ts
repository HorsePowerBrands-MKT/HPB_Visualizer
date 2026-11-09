/**
 * Image-type detection and HEIC → JPEG conversion for uploads.
 *
 * iPhones shoot HEIC by default. iOS converts to JPEG automatically when a
 * file input's `accept` leaves HEIC out, so most phone uploads never reach
 * this code, but desktop browsers (an AirDropped photo on a Mac, a drag
 * and drop), Android phones and "Files"-app picks hand us the raw HEIC.
 *
 * Conversion is layered so one decoder's gap is not the customer's problem:
 *   1. the browser itself (Safari on macOS / iOS decodes HEIC natively),
 *   2. `heic-to` (current libheif in WebAssembly, handles recent iOS files),
 *   3. `heic2any` (older libheif, kept as a last resort).
 * Every decoder is loaded on demand so none of them ship in the main bundle
 * or run on the server.
 */

const HEIC_TYPES = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
const SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Detect HEIC/HEIF by MIME type or file extension.
 * Some devices report an empty file.type for HEIC, so the extension check is essential.
 * See `sniffImageMime` for a content-based check.
 */
export function isHeic(file: File): boolean {
  if (HEIC_TYPES.includes(file.type.toLowerCase())) return true;
  return /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name);
}

/**
 * Check whether a file is an image type the pipeline can handle natively
 * (after any HEIC conversion has already been applied).
 */
export function isSupportedImageType(file: File): boolean {
  return SUPPORTED_TYPES.includes(file.type.toLowerCase());
}

/** HEIF container brands that mean "a still HEIC photo we should convert". */
const HEIF_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1', 'heif']);

/**
 * Identify an image by its first bytes rather than by what the browser or
 * OS claims. Returns a MIME type for JPEG, PNG, WebP, GIF and HEIC/HEIF, or
 * null when the content is not a recognised image.
 */
export async function sniffImageMime(file: File): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (head.length < 12) return null;
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg';
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return 'image/png';
  const ascii = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(0, 4) === 'GIF8') return 'image/gif';
  if (ascii(4, 8) === 'ftyp' && HEIF_BRANDS.has(ascii(8, 12).trim().toLowerCase())) return 'image/heic';
  return null;
}

/** Longest side of the JPEG produced by the native decoder; the pipeline compresses to 1920px anyway. */
const NATIVE_MAX_DIMENSION = 2560;
const JPEG_QUALITY = 0.88;
const NATIVE_TIMEOUT_MS = 10_000;
const WASM_TIMEOUT_MS = 45_000;

/** Thrown when every decoder failed; `attempts` says what each one reported. */
export class HeicConversionError extends Error {
  readonly attempts: readonly string[];
  constructor(attempts: readonly string[]) {
    super(`HEIC conversion failed: ${attempts.join(' | ')}`);
    this.name = 'HeicConversionError';
    this.attempts = attempts;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob && blob.size > 0 ? resolve(blob) : reject(new Error('canvas produced no JPEG'))),
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

/**
 * Decoder 1: the browser. Safari (macOS and iOS) opens HEIC natively, so a
 * bitmap can be drawn straight to a canvas. Browsers without HEIC support
 * reject `createImageBitmap` almost immediately, which hands off to the
 * WebAssembly decoders below.
 */
async function convertWithBrowser(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') throw new Error('createImageBitmap unavailable');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, NATIVE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await canvasToJpeg(canvas);
  } finally {
    bitmap.close();
  }
}

/** Decoder 2: `heic-to` (current libheif, runs in a worker). */
async function convertWithHeicTo(file: File): Promise<Blob> {
  const { heicTo } = await import('heic-to');
  return heicTo({ blob: file, type: 'image/jpeg', quality: JPEG_QUALITY });
}

/** Decoder 3: `heic2any` (older libheif), kept as a last resort. */
async function convertWithHeic2any(file: File): Promise<Blob> {
  const heic2any = (await import('heic2any')).default;
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY });
  // Multi-image containers (bursts) come back as an array; the first is the key photo.
  return Array.isArray(result) ? result[0] : result;
}

const DECODERS: ReadonlyArray<{ name: string; timeoutMs: number; run: (file: File) => Promise<Blob> }> = [
  { name: 'browser', timeoutMs: NATIVE_TIMEOUT_MS, run: convertWithBrowser },
  { name: 'heic-to', timeoutMs: WASM_TIMEOUT_MS, run: convertWithHeicTo },
  { name: 'heic2any', timeoutMs: WASM_TIMEOUT_MS, run: convertWithHeic2any },
];

/**
 * Convert a HEIC/HEIF file to JPEG. Returns a new File with the correct
 * MIME type and a `.jpg` name. Tries each decoder in turn and throws
 * `HeicConversionError` (listing every failure) only when all of them give
 * up. `onAttempt` reports which decoder produced the result, for logging.
 */
export async function convertHeicToJpeg(
  file: File,
  onAttempt?: (decoder: string, outcome: 'ok' | 'failed', detail?: string) => void
): Promise<File> {
  const failures: string[] = [];
  for (const decoder of DECODERS) {
    try {
      const blob = await withTimeout(decoder.run(file), decoder.timeoutMs, decoder.name);
      if (!blob || blob.size === 0) throw new Error('empty result');
      onAttempt?.(decoder.name, 'ok');
      const name = file.name.replace(/\.(heic|heif)$/i, '') + '.jpg';
      return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      failures.push(`${decoder.name}: ${detail}`);
      onAttempt?.(decoder.name, 'failed', detail);
    }
  }
  throw new HeicConversionError(failures);
}
