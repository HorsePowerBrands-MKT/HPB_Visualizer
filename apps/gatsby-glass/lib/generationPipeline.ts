/**
 * Shared generate pipeline for visualizer product modules.
 *
 * Runs the four server calls that make up one generation, in the same order
 * the shower flow always has:
 *   1. POST /api/upload-submission   (store the original photo + consent)
 *   2. POST /api/generate-visualization
 *   3. PATCH /api/upload-submission  (attach the generated image)
 *   4. POST /api/save-visualization  (per-generation record)
 *
 * The caller supplies the product, the finished prompt string, and the
 * product-specific metadata for steps 1 and 4; it owns all React state
 * (history, result, popups, step navigation). `onGenerated` fires after
 * step 3 so the caller can show the result before the save round-trip.
 *
 * Extracted from `GatsbyGlassVisualizer.onGenerate`.
 */

import { fileToBase64Data } from '@repo/visualizer-core';
import type { VisualizerProduct } from '@repo/types';

/** Thrown when the server reports the monthly generation limit was reached (HTTP 429). */
export class GenerationRateLimitedError extends Error {
  readonly rateLimited = true;
  readonly usageCount?: number;
  constructor(usageCount?: number) {
    super('Monthly design preview limit reached');
    this.name = 'GenerationRateLimitedError';
    this.usageCount = usageCount;
  }
}

export interface GenerationPipelineArgs {
  product: VisualizerProduct;
  imageFile: File;
  inspirationFile?: File | null;
  prompt: string;
  sessionId: string;
  generationIndex: number;
  userFingerprint: string | null;
  marketingConsent: boolean;
  /** Existing submission for this session (so re-generates don't create a new row). */
  submissionId: string | null;
  /** Whitelisted keys only — see `/api/upload-submission`. */
  submissionMetadata: Record<string, string | null>;
  /** Product-specific fields merged into the `/api/save-visualization` body. */
  saveRecord: Record<string, unknown>;
  /** Extra fields merged into the generate request (e.g. shower `doorType`). */
  generateExtras?: Record<string, unknown>;
  /** `?team=` attribution fallback when the server does not return a team location. */
  teamUtm: string | null;
  /** Fires once the image is back (before the save record is written). */
  onGenerated?: (outcome: GenerationPipelineResult) => void;
  /** Fires as soon as the submission row exists, even if generation later fails. */
  onSubmissionCreated?: (submissionId: string) => void;
}

export interface GenerationPipelineResult {
  /** Data URL of the (watermarked) image to display. */
  image: string;
  originalUrl: string | null;
  watermarkedUrl: string | null;
  usageCount?: number;
  limit?: number;
  teamLocationId?: string | null;
  isCandidate?: boolean;
  submissionId: string | null;
}

export async function runGenerationPipeline(
  args: GenerationPipelineArgs
): Promise<GenerationPipelineResult> {
  const {
    product,
    imageFile,
    inspirationFile,
    prompt,
    sessionId,
    generationIndex,
    userFingerprint,
    marketingConsent,
    submissionMetadata,
    saveRecord,
    generateExtras,
    teamUtm,
    onGenerated,
    onSubmissionCreated,
  } = args;

  const bathroomImageData = await fileToBase64Data(imageFile);

  // 1. Upload original photo and create submission record
  let currentSubmissionId = args.submissionId;
  try {
    const imageDataUrl = `data:${bathroomImageData.mimeType || 'image/png'};base64,${bathroomImageData.data}`;
    const submissionRes = await fetch('/api/upload-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: imageDataUrl,
        uploadConsent: true,
        marketingConsent,
        sourceUrl: typeof window !== 'undefined' ? window.location.href : null,
        metadata: submissionMetadata,
      }),
    });
    if (submissionRes.ok) {
      const submissionData = await submissionRes.json();
      currentSubmissionId = submissionData.submissionId;
      if (currentSubmissionId) onSubmissionCreated?.(currentSubmissionId);
    }
  } catch (subErr) {
    console.error('[SUBMISSION] Failed to create submission:', subErr);
  }

  // 2. Generate
  const requestBody: Record<string, unknown> = {
    bathroomImage: bathroomImageData,
    prompt,
    targetWidth: bathroomImageData.width,
    targetHeight: bathroomImageData.height,
    sessionId,
    generationIndex,
    ...(product !== 'shower' ? { product } : {}),
    ...(generateExtras ?? {}),
    ...(userFingerprint ? { userFingerprint } : {}),
  };

  if (inspirationFile) {
    requestBody.inspirationImage = await fileToBase64Data(inspirationFile);
  }

  const response = await fetch('/api/generate-visualization', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.rateLimited) {
      throw new GenerationRateLimitedError(
        typeof errorData.usageCount === 'number' ? errorData.usageCount : undefined
      );
    }
    throw new Error(errorData.error || 'Failed to generate design preview');
  }

  const result = await response.json();

  // 3. Update submission with the generated image URL
  if (currentSubmissionId && (result.watermarkedUrl || result.originalUrl)) {
    try {
      await fetch('/api/upload-submission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: currentSubmissionId,
          generatedImageUrl: result.watermarkedUrl || result.originalUrl,
        }),
      });
    } catch (patchErr) {
      console.error('[SUBMISSION] Failed to update submission with generated image:', patchErr);
    }
  }

  const outcome: GenerationPipelineResult = {
    image: result.image,
    originalUrl: result.originalUrl ?? null,
    watermarkedUrl: result.watermarkedUrl ?? null,
    usageCount: typeof result.usageCount === 'number' ? result.usageCount : undefined,
    limit: typeof result.limit === 'number' ? result.limit : undefined,
    teamLocationId: result.teamLocationId ?? null,
    isCandidate: result.isCandidate === true,
    submissionId: currentSubmissionId,
  };

  onGenerated?.(outcome);

  // 4. Save visualization record (images already uploaded by generate endpoint)
  try {
    await fetch('/api/save-visualization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        generationIndex,
        ...(product !== 'shower' ? { product } : {}),
        ...saveRecord,
        visualizationImage: result.watermarkedUrl || null,
        originalImageUrl: result.originalUrl || null,
        team: result.teamLocationId || teamUtm || null,
        userFingerprint: userFingerprint || null,
      }),
    });
  } catch (saveError) {
    console.error('[AUTO-SAVE] Failed to save visualization:', saveError);
  }

  return outcome;
}
