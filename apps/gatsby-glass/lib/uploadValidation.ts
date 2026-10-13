/**
 * Shared upload + validation pipeline for visualizer photos.
 *
 * Handles the device-side checks (size cap, HEIC conversion, format check,
 * compression for large originals), converts to base64 and calls
 * `/api/validate-image` for the given product. Returns either the prepared
 * file plus the server's validation result, or a user-facing error message.
 *
 * Extracted from `GatsbyGlassVisualizer.handleFileChange` so the shower and
 * railing flows share one implementation. Callers own the React state side
 * effects (set preview, store detected values, reset the input element).
 */

import {
  fileToBase64Data,
  isHeic,
  isSupportedImageType,
  convertHeicToJpeg,
  compressImage,
} from '@repo/visualizer-core';
import type { VisualizerProduct } from '@repo/types';

/** Raw file size above which we resize before validate/generate to avoid Vercel ~4.5MB JSON body limits (base64 expands ~4/3). */
export const VALIDATE_COMPRESS_THRESHOLD_BYTES = 2.5 * 1024 * 1024;

/** Hard upper bound on the raw file we'll even attempt to process in-browser.
 *  Modern iPhone JPEGs are routinely 5–15 MB and HEICs can be larger; 50 MB
 *  comfortably covers ProRAW-derived exports while still blocking absurd uploads. */
export const MAX_RAW_FILE_BYTES = 50 * 1024 * 1024;

/** Maps browser fetch failures (Safari "Load failed", Chrome "Failed to fetch", etc.) to one clear message. */
export function userFacingValidationError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    /load failed|failed to fetch|networkerror|network error|aborted|timeout|status 0|err_connection|err_network|net::/i.test(
      raw
    )
  ) {
    return (
      "We couldn't reach the server to verify your photo. Check your connection (try Wi‑Fi if you're on mobile data). " +
      'Large camera shots can also fail over slow links—try again (big images are resized automatically) or pick a smaller JPEG from your gallery or files app.'
    );
  }
  if (/Failed to read file|Failed to load image/i.test(raw)) {
    return "We couldn't read this image on your device. Try another photo or a JPEG exported from your gallery.";
  }
  return raw || 'Unable to verify image. Please try again.';
}

/** Server response for a shower upload (`/api/validate-image`, product absent or 'shower'). */
export interface ShowerValidationResult {
  valid?: boolean;
  reason?: string;
  shape?: string;
  detectedHardware?: string;
  contentFlag?: string;
}

/** Server response for a railing upload (`/api/validate-image`, product 'railing'). */
export interface RailingValidationResult {
  valid?: boolean;
  reason?: string;
  setting?: 'interior' | 'exterior';
  existingCondition?: string;
  detectedApplication?: string;
  contentFlag?: string;
}

export type UploadValidationOutcome<R> =
  | { ok: true; file: File; result: R }
  | { ok: false; message: string };

interface ValidateOptions {
  product: VisualizerProduct;
  /**
   * Fired right before a slow phase begins (HEIC conversion, network
   * validation) so the caller can show a spinner at the same moments the
   * original inline implementation did.
   */
  onBusy?: () => void;
}

const INVALID_FALLBACK: Record<VisualizerProduct, string> = {
  shower: 'The uploaded image does not appear to be a bathroom or shower. Please upload a valid photo.',
  railing:
    'The uploaded image does not appear to show a staircase, balcony, deck, patio, or pool area. Please upload a photo of the space where the railing will go.',
};

export async function validateUploadedPhoto(
  file: File,
  options: ValidateOptions & { product: 'shower' }
): Promise<UploadValidationOutcome<ShowerValidationResult>>;
export async function validateUploadedPhoto(
  file: File,
  options: ValidateOptions & { product: 'railing' }
): Promise<UploadValidationOutcome<RailingValidationResult>>;
export async function validateUploadedPhoto(
  file: File,
  options: ValidateOptions
): Promise<UploadValidationOutcome<ShowerValidationResult | RailingValidationResult>> {
  const { product, onBusy } = options;
  console.log('[FILE UPLOAD] File selected:', file.name, file.size, file.type, 'product:', product);

  if (file.size > MAX_RAW_FILE_BYTES) {
    console.error('[FILE UPLOAD] File too large:', file.size);
    return {
      ok: false,
      message:
        "That photo is unusually large (over 50MB). On iPhone, open the photo, tap Share → Save as JPEG, or use a screenshot — we'll automatically resize it for you.",
    };
  }

  let working = file;

  // Convert HEIC/HEIF (common on iPhones) to JPEG before processing
  if (isHeic(working)) {
    onBusy?.();
    try {
      console.log('[FILE UPLOAD] Converting HEIC to JPEG...');
      working = await convertHeicToJpeg(working);
      console.log('[FILE UPLOAD] HEIC conversion complete:', working.name, working.type);
    } catch (err) {
      console.error('[FILE UPLOAD] HEIC conversion failed:', err);
      return {
        ok: false,
        message:
          'Your photo is in HEIC format, which is hard to convert on a phone. ' +
          'Open the photo in your gallery, tap Share → Save as JPEG (or screenshot it), then upload the JPEG version.',
      };
    }
  }

  if (!isSupportedImageType(working)) {
    return {
      ok: false,
      message: "This image format isn't supported. Please upload a JPEG, PNG, or WebP photo.",
    };
  }

  onBusy?.();
  console.log('[FILE UPLOAD] Starting validation for product:', product);

  try {
    let fileForFlow = working;
    if (fileForFlow.size > VALIDATE_COMPRESS_THRESHOLD_BYTES) {
      try {
        console.log('[FILE UPLOAD] Compressing large image before upload...');
        fileForFlow = await compressImage(fileForFlow, 1920);
        // Fallback pass for huge originals (e.g. 20MB+ iPhone exports) where a
        // single 1920px resize can still exceed the server's ~4.5MB body limit.
        if (fileForFlow.size > VALIDATE_COMPRESS_THRESHOLD_BYTES) {
          console.log('[FILE UPLOAD] Still large after first pass, compressing again to 1280px...');
          fileForFlow = await compressImage(fileForFlow, 1280);
        }
      } catch (compressErr) {
        console.error('[FILE UPLOAD] Compression failed:', compressErr);
        return {
          ok: false,
          message:
            "We couldn't resize this photo for upload. Try a smaller image or a JPEG from your gallery or files app.",
        };
      }
    }

    console.log('[FILE UPLOAD] Converting to base64...');
    const imageData = await fileToBase64Data(fileForFlow);
    console.log('[FILE UPLOAD] Base64 conversion complete, data length:', imageData.data.length);

    console.log('[FILE UPLOAD] Calling validation API...');
    const response = await fetch('/api/validate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The shower request body is unchanged; railing adds the product tag.
      body: JSON.stringify(product === 'shower' ? imageData : { ...imageData, product }),
    });

    console.log('[FILE UPLOAD] API response status:', response.status);

    if (!response.ok) {
      let message = `Couldn't verify your photo (error ${response.status}). Please try again.`;
      try {
        const errJson = (await response.json()) as { reason?: string; error?: string };
        if (typeof errJson.reason === 'string') message = errJson.reason;
        else if (typeof errJson.error === 'string') message = errJson.error;
      } catch {
        /* non-JSON error body */
      }
      if (response.status === 413) {
        message =
          'This photo is too large to upload. Use a smaller export from your gallery or take a new picture at lower quality.';
      } else if (response.status >= 500) {
        message = `${message} If this keeps happening, try Wi‑Fi or again later.`;
      }
      return { ok: false, message };
    }

    let result: ShowerValidationResult | RailingValidationResult;
    try {
      result = await response.json();
    } catch {
      return {
        ok: false,
        message: 'The server sent an unexpected response. Please try again or use a different photo.',
      };
    }
    console.log('[FILE UPLOAD] API result:', result);

    if (!result.valid) {
      console.warn('[FILE UPLOAD] Image validation failed:', result.reason);
      return { ok: false, message: result.reason || INVALID_FALLBACK[product] };
    }

    return { ok: true, file: fileForFlow, result };
  } catch (err) {
    console.error('[FILE UPLOAD] Error during validation:', err);
    return { ok: false, message: userFacingValidationError(err) };
  }
}
