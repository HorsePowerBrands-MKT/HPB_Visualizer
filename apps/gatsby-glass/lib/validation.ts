import { z } from 'zod';

/**
 * Validation schemas for API requests
 * Using Zod for runtime type checking and validation
 */

// Base64 image data schema.
//
// width / height are optional because not every caller has them at validation
// time, but when they ARE present we forward them to the image-generation
// model so it can constrain the output aspect ratio to match input_1
// (Gemini 3.x image models default to 1:1 / 16:9 otherwise, which mirrors
// portrait photos into panoramas).
export const ImageDataSchema = z.object({
  data: z.string().min(100, 'Image data too short'),
  mimeType: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Invalid image type. Must be JPEG, PNG, or WebP' })
  }),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

// Image validation request
export const ValidationRequestSchema = z.object({
  imageData: z.string().min(100, 'Image data required'),
  mimeType: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
}).or(z.object({
  data: z.string().min(100, 'Image data required'),
  mimeType: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
}));

// Visualization generation request
//
// NOTE on prompt size: the structured JSON-spec prompts we build for the
// visualization route are ~13-15k characters (system prompt is sent as
// systemInstruction and is not part of this field). The 32_000 cap leaves
// comfortable headroom for future template growth while still bounding the
// request body to a sane size — anything larger almost certainly indicates a
// bug rather than legitimate prompt content.
//
// NOTE on doorType/pivotDirection: the route uses these to select an anatomy
// reference image to send alongside the bathroom photo (currently only for
// pivot doors, where the model has a strong wrong-default bias). They are
// optional — if absent, no reference image is attached and the model falls
// back to text-only instructions.
export const VisualizationRequestSchema = z.object({
  bathroomImage: ImageDataSchema,
  inspirationImage: ImageDataSchema.optional(),
  prompt: z.string().min(10, 'Prompt too short').max(32_000, 'Prompt too long'),
  doorType: z.enum(['hinged', 'pivot', 'sliding']).optional(),
  pivotDirection: z.enum(['left', 'right', 'double']).optional(),
  glassStyle: z.enum(['clear', 'low_iron', 'p516']).optional(),
  hardwareFinish: z.enum(['chrome', 'brushed_nickel', 'matte_black', 'polished_brass', 'oil_rubbed_bronze']).optional(),
  showerShape: z.enum(['standard', 'neo_angle', 'tub']).optional(),
  userFingerprint: z.string().uuid('Invalid fingerprint').optional(),
  // Used by the image model to constrain the output aspect ratio to match
  // input_1. Sent by the client when it knows the input dimensions; the
  // server falls back to bathroomImage.width / height (if present) or to a
  // 3:4 portrait default.
  targetWidth: z.number().int().positive().optional(),
  targetHeight: z.number().int().positive().optional(),
});

// Lead submission request
export const LeadSubmissionSchema = z.object({
  // Contact information
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number too short').max(20, 'Phone number too long').optional(),
  zipCode: z.string().min(5, 'Invalid zip code').max(10, 'Invalid zip code'),
  
  // Visualization details
  visualizationImage: z.string().optional(),
  originalImage: z.string().optional(),
  doorType: z.string().optional(),
  finish: z.string().optional(),
  hardware: z.string().optional(),
  handleStyle: z.string().optional(),
  trackPreference: z.string().optional(),
  mode: z.string().optional(),
  showerShape: z.string().optional(),
  sessionId: z.string().optional(),
  source: z.string().optional(),
  tcpaConsent: z.boolean().optional(),
  tcpaConsentText: z.string().optional(),
  consentUserAgent: z.string().optional(),
  userFingerprint: z.string().optional(),
  leadType: z.enum(['SAS', 'RAQ', 'POP']).optional(),
});

// Export types
export type ImageData = z.infer<typeof ImageDataSchema>;
export type ValidationRequest = z.infer<typeof ValidationRequestSchema>;
export type VisualizationRequest = z.infer<typeof VisualizationRequestSchema>;
export type LeadSubmission = z.infer<typeof LeadSubmissionSchema>;
