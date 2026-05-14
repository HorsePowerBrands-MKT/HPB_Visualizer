import { z } from 'zod';

/**
 * Validation schemas for API requests
 * Using Zod for runtime type checking and validation
 */

// Base64 image data schema
export const ImageDataSchema = z.object({
  data: z.string().min(100, 'Image data too short'),
  mimeType: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Invalid image type. Must be JPEG, PNG, or WebP' })
  }),
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
export const VisualizationRequestSchema = z.object({
  bathroomImage: ImageDataSchema,
  inspirationImage: ImageDataSchema.optional(),
  prompt: z.string().min(10, 'Prompt too short').max(32_000, 'Prompt too long'),
  doorType: z.enum(['hinged', 'pivot', 'sliding']).optional(),
  glassStyle: z.enum(['clear', 'low_iron', 'p516']).optional(),
  hardwareFinish: z.enum(['chrome', 'brushed_nickel', 'matte_black', 'polished_brass', 'oil_rubbed_bronze']).optional(),
  showerShape: z.enum(['standard', 'neo_angle', 'tub']).optional(),
  userFingerprint: z.string().uuid('Invalid fingerprint').optional(),
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
