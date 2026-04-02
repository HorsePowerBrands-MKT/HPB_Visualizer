const HEIC_TYPES = ['image/heic', 'image/heif'];
const SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Detect HEIC/HEIF by MIME type or file extension.
 * Some iOS devices report an empty file.type for HEIC, so extension check is essential.
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

const HEIC_CONVERT_TIMEOUT_MS = 30_000;

/**
 * Convert a HEIC/HEIF file to JPEG. Returns a new File with the correct MIME type.
 * Uses a dynamic import so heic2any (which requires `window`) is never loaded on the server.
 *
 * NOTE: In most cases iOS/Chrome-on-iOS auto-convert HEIC→JPEG when the `<input accept>`
 * does NOT list image/heic, so this is a fallback for edge cases (desktop, older Android).
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default;

  const conversionPromise = heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
  const timeoutPromise = new Promise<never>((_r, reject) =>
    setTimeout(() => reject(new Error('HEIC conversion timed out')), HEIC_CONVERT_TIMEOUT_MS),
  );

  const blob = await Promise.race([conversionPromise, timeoutPromise]);
  const result = Array.isArray(blob) ? blob[0] : blob;
  const name = file.name
    .replace(/\.heic$/i, '.jpg')
    .replace(/\.heif$/i, '.jpg');
  return new File([result], name, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}
