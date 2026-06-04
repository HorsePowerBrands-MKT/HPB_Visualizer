import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { 
  ImageData, 
  ImageValidationResponse, 
  VisualizationRequest, 
  VisualizationResponse 
} from '@repo/types';
import {
  getSystemPromptFromTemplate,
  getValidationPromptFromTemplate,
} from '@repo/prompt-templates';

/**
 * Get the system prompt from JSON template
 * The template can be edited at: packages/prompt-templates/templates/system-v1.json
 */
function getSystemPrompt(): string {
  return getSystemPromptFromTemplate().text;
}

/**
 * Get the validation prompt from JSON template
 * The template can be edited at: packages/prompt-templates/templates/validation-v1.json
 */
function getValidationPrompt(): string {
  const prompt = getValidationPromptFromTemplate().text;
  console.log('[VALIDATION PROMPT]:', prompt.substring(0, 200) + '...');
  return prompt;
}

export interface GeminiConfig {
  apiKey: string;
}

/**
 * Gemini image-generation model used by `generateVisualization`.
 *
 * As of May 2026 the model lineup is:
 *   - gemini-2.5-flash-image          → Nano Banana       (Aug 2025, deprecated default)
 *   - gemini-3.1-flash-image-preview  → Nano Banana 2     (Feb 26 2026, fast tier)
 *   - gemini-3-pro-image-preview      → Nano Banana Pro   (Nov 20 2025, studio quality)
 *
 * Nano Banana Pro is the right default for our use case — single-image
 * customer-facing bathroom visualizations where rendering quality matters
 * far more than per-call cost or latency. It has materially better
 * real-world reasoning ("preserve this room but install glass over the
 * existing shower"), better small-detail fidelity (hinges, handles, edge
 * highlights), and lower hallucination rates than the 2.5 model we were
 * on before.
 *
 * Override via `GEMINI_IMAGE_MODEL` env var to swap to Flash 3.1 (cheaper +
 * faster) or back to 2.5 in an emergency, without a redeploy.
 */
const DEFAULT_IMAGE_MODEL = 'gemini-3-pro-image-preview';
function getImageModelName(): string {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL;
}

/**
 * Aspect ratios supported by gemini-3-pro-image-preview (and the 3.1 flash
 * variant). Source: the @google/genai SDK ImageConfig.aspectRatio docstring.
 * Listed as [label, value] so we can snap an input ratio to the closest one.
 */
const SUPPORTED_ASPECT_RATIOS: ReadonlyArray<readonly [string, number]> = [
  ['9:16', 9 / 16],
  ['2:3', 2 / 3],
  ['3:4', 3 / 4],
  ['1:1', 1],
  ['4:3', 4 / 3],
  ['3:2', 3 / 2],
  ['16:9', 16 / 9],
  ['21:9', 21 / 9],
];

/**
 * Snap an input width/height to the closest supported aspect ratio for the
 * image model. We compare in log space so a 4:3 landscape and a 3:4 portrait
 * are equidistant from 1:1 (instead of landscape disproportionately winning).
 *
 * Why we need this: Gemini 2.5 Flash Image inferred the output aspect ratio
 * from input_1. Gemini 3 Pro / 3.1 Flash Image do NOT — if you don't pass
 * imageConfig.aspectRatio they default to their own ratio (typically 1:1 or
 * 16:9), which makes a portrait bathroom photo come back as a stretched
 * landscape with the scene mirrored to fill the extra horizontal space.
 */
function pickAspectRatio(
  width?: number,
  height?: number
): string {
  if (!width || !height || width <= 0 || height <= 0) {
    // No dimensions — assume portrait phone photo (the most common upload).
    return '3:4';
  }
  const ratio = width / height;
  const logTarget = Math.log(ratio);
  let bestLabel = SUPPORTED_ASPECT_RATIOS[0][0];
  let bestDistance = Infinity;
  for (const [label, value] of SUPPORTED_ASPECT_RATIOS) {
    const distance = Math.abs(Math.log(value) - logTarget);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestLabel = label;
    }
  }
  return bestLabel;
}

/**
 * Error thrown when Gemini reports it is rate-limited or out of quota
 * (HTTP 429 / status RESOURCE_EXHAUSTED). Surfaced separately so the API
 * route can return a friendly retry message instead of leaking the raw
 * Gemini error JSON to the user.
 */
export class GeminiRateLimitError extends Error {
  readonly isRateLimit = true;
  constructor(message = 'Gemini reported the visualization service is briefly busy.') {
    super(message);
    this.name = 'GeminiRateLimitError';
  }
}

/**
 * Detects whether a thrown error from the Gemini SDK represents a 429 /
 * RESOURCE_EXHAUSTED response. The SDK surfaces these in a few different
 * shapes depending on transport, so we normalize across all of them.
 */
function isRateLimitError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as { status?: number; code?: number; message?: string };
  if (anyErr.status === 429 || anyErr.code === 429) return true;
  const msg = String(anyErr.message ?? err);
  return /\b429\b|RESOURCE_EXHAUSTED|quota|rate\s*limit/i.test(msg);
}

/**
 * Generate a photorealistic visualization of a shower glass installation.
 * Includes one automatic retry with a short backoff if Gemini reports a
 * 429 / RESOURCE_EXHAUSTED — these are usually transient burst-rate issues.
 *
 * `referenceImages` (on the request) are authoritative anatomy/product
 * reference images appended AFTER input_1 (bathroom) and AFTER input_2
 * (optional inspiration). Each one is preceded in the `parts` array by its
 * `description` text so the model knows what it is, what to copy from it,
 * and what to ignore (e.g., labels, finish, surrounding scene). Without
 * the per-image descriptions, Gemini tends to copy the background and
 * color from the reference instead of just the door anatomy.
 */
export async function generateVisualization(
  config: GeminiConfig,
  request: VisualizationRequest
): Promise<VisualizationResponse> {
  const { apiKey } = config;
  const {
    bathroomImage,
    inspirationImage,
    referenceImages,
    prompt,
    targetWidth,
    targetHeight,
  } = request;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }

  if (!bathroomImage || !prompt) {
    throw new Error('bathroomImage and prompt are required');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build the parts array. Order matters: a short edit-mandate preamble
  // first so the model is anchored on "edit, don't preserve" BEFORE it sees
  // the bathroom photo, then the bathroom (input_1) it should edit, then
  // any inspiration photo, then reference images (each preceded by its
  // description), then the full structured text spec.
  //
  // Without the preamble the bathroom photo is the very first thing in the
  // conversation, which makes it easy for the model to default to "this is
  // the canvas, return it unchanged" — especially when the trailing spec
  // is 25k+ characters and attention spreads thin. The preamble re-anchors
  // the task in a single short, high-priority block of text.
  const parts: any[] = [];

  parts.push({
    text: [
      'EDIT TASK — READ THIS BEFORE LOOKING AT ANY IMAGE.',
      '',
      'The very next image (input_1) is a photo of a bathroom or shower area.',
      'Your output MUST be a modified version of input_1 with a NEW glass',
      'shower enclosure installed where the shower currently is. The output',
      'must NOT be identical to input_1 — a render that returns the input',
      'unchanged (no glass visible, no hardware visible, no door visible) is',
      'a FAILED render and you must redo it.',
      '',
      'Any additional images that follow input_1 are reference material',
      '(inspiration photos and/or authoritative product references). They',
      'are NEVER the canvas to render into — input_1 is the only canvas.',
      'Each reference image is preceded by its own text block explaining',
      'what to copy from it and, just as importantly, what NOT to copy.',
      '',
      'After all images you will receive a long structured INSTALL_',
      'SPECIFICATION JSON describing every detail of the enclosure to',
      'install. That JSON is non-negotiable; obey every preserve_exact,',
      'remove, forbidden_elements, spatial_map, and self_check_before_',
      'output entry. But the master rule is this single short paragraph:',
      'edit input_1, do not preserve it.',
    ].join('\n'),
  });

  // The target bathroom (input_1)
  parts.push({
    inlineData: {
      data: bathroomImage.data,
      mimeType: bathroomImage.mimeType
    }
  });

  // Position 2 (optional): inspiration photo (input_2 in the prompt)
  if (inspirationImage) {
    parts.push({
      inlineData: {
        data: inspirationImage.data,
        mimeType: inspirationImage.mimeType
      }
    });
  }

  // Position 3+ (optional): anatomy reference images for door types where the
  // model has a strong wrong-default bias (most notably pivot, which the
  // model tends to render as hinged). Each reference is introduced by its
  // description so the model knows what to copy from it and what to ignore.
  if (referenceImages && referenceImages.length > 0) {
    for (const ref of referenceImages) {
      parts.push({ text: ref.description });
      parts.push({
        inlineData: {
          data: ref.image.data,
          mimeType: ref.image.mimeType,
        }
      });
    }
    console.log(
      `[GEMINI generateVisualization] Attached ${referenceImages.length} anatomy reference image(s): ${referenceImages
        .map((r) => r.label)
        .join(', ')}`
    );
  }

  // Last: the structured text prompt
  parts.push({ text: prompt });

  const modelName = getImageModelName();

  // Snap the output aspect ratio to the closest supported value, derived
  // from input_1's actual dimensions. Without this the 3.x image models
  // default to their own aspect ratio (typically 1:1 / 16:9) which makes
  // a portrait bathroom photo come back as a panoramic render with the
  // scene mirrored/duplicated to fill the extra horizontal space.
  const aspectRatio = pickAspectRatio(
    bathroomImage.width ?? targetWidth,
    bathroomImage.height ?? targetHeight
  );

  console.log(
    `[GEMINI generateVisualization] model=${modelName}` +
      ` aspectRatio=${aspectRatio}` +
      ` (inputDims=${bathroomImage.width ?? targetWidth ?? '?'}` +
      `x${bathroomImage.height ?? targetHeight ?? '?'})` +
      ` parts.length=${parts.length}` +
      ` (preamble + bathroom${inspirationImage ? ' + inspiration' : ''}` +
      `${referenceImages?.length ? ` + ${referenceImages.length} reference(s)` : ''}` +
      ` + spec); spec.length=${prompt.length} chars`
  );

  const generateOnce = () =>
    ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction: getSystemPrompt(),
        responseModalities: [Modality.IMAGE],
        temperature: 0.3,
        imageConfig: {
          aspectRatio,
        },
      },
    });

  let response;
  try {
    response = await generateOnce();
  } catch (err) {
    if (isRateLimitError(err)) {
      console.warn('[GEMINI generateVisualization] 429/RESOURCE_EXHAUSTED on first attempt, retrying once after 2s backoff');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        response = await generateOnce();
      } catch (retryErr) {
        if (isRateLimitError(retryErr)) {
          console.error('[GEMINI generateVisualization] Retry also rate-limited, surfacing GeminiRateLimitError');
          throw new GeminiRateLimitError();
        }
        throw retryErr;
      }
    } else {
      throw err;
    }
  }

  // Extract the generated image
  const candidates = response.candidates;
  if (!candidates?.[0]?.content?.parts) {
    throw new Error("No candidates returned by the model.");
  }
  for (const part of candidates[0].content.parts) {
    if (part.inlineData?.data) {
      return {
        image: `data:image/png;base64,${part.inlineData.data}`
      };
    }
  }

  throw new Error("No image was generated by the model.");
}

/**
 * Validate an image and detect shower shape
 */
export async function validateImage(
  config: GeminiConfig,
  imageData: ImageData
): Promise<ImageValidationResponse> {
  const { apiKey } = config;

  console.log('[GEMINI validateImage] Starting validation');

  if (!apiKey) {
    console.error('[GEMINI validateImage] API key missing');
    throw new Error('GEMINI_API_KEY is required');
  }

  if (!imageData.data || !imageData.mimeType) {
    console.error('[GEMINI validateImage] Invalid image data', {
      hasData: !!imageData.data,
      mimeType: imageData.mimeType
    });
    throw new Error('imageData and mimeType are required');
  }

  console.log('[GEMINI validateImage] Image data valid, length:', imageData.data.length);

  try {
    const ai = new GoogleGenAI({ apiKey });
    console.log('[GEMINI validateImage] GoogleGenAI client created');

    const validationPrompt = getValidationPrompt();
    console.log('[GEMINI validateImage] Using validation prompt:', validationPrompt.substring(0, 100) + '...');

    console.log('[GEMINI validateImage] Calling Gemini API...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: { 
              data: imageData.data, 
              mimeType: imageData.mimeType 
            }
          },
          {
            text: validationPrompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            reason: { type: Type.STRING, description: "Short user-friendly error message if invalid." },
            contentFlag: { type: Type.STRING, enum: ["safe", "pii", "inappropriate"] },
            shape: { type: Type.STRING, enum: ["standard", "neo_angle", "tub"] },
            detectedHardware: { type: Type.STRING, enum: ["chrome", "brushed_nickel", "matte_black", "polished_brass", "oil_rubbed_bronze", "none"] }
          },
          required: ["isValid", "contentFlag", "shape", "detectedHardware"]
        },
      },
    });

    console.log('[GEMINI validateImage] API response received');
    const text = response.text;
    console.log('[GEMINI validateImage] Response text:', text);

    if (!text) {
      console.error('[GEMINI validateImage] Empty response text');
      return {
        valid: false,
        reason: "Could not analyze image.",
        shape: "standard",
        detectedHardware: "none"
      };
    }

    const result = JSON.parse(text);
    console.log('[GEMINI validateImage] Parsed result:', result);

    const contentFlag = result.contentFlag || 'safe';

    // Override reason with user-friendly messages for content safety issues
    let reason = result.reason;
    if (contentFlag === 'pii') {
      reason = 'This image appears to contain a person. For privacy, please upload a photo of just your bathroom or shower area with no people visible. Tip: Use a timer or prop your phone up to take the photo.';
    } else if (contentFlag === 'inappropriate') {
      reason = 'This image contains content that cannot be processed. Please upload an appropriate photo of your bathroom or shower area.';
    }

    return {
      valid: result.isValid,
      reason,
      shape: result.shape || "standard",
      detectedHardware: result.detectedHardware || "none",
      contentFlag,
    };
  } catch (error) {
    console.error('[GEMINI validateImage] Error during validation:', error);
    throw error;
  }
}
