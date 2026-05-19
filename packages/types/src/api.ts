import { ShowerShape } from './visualizer';

// Image validation response
export interface ImageValidationResponse {
  valid: boolean;
  reason?: string;
  shape: ShowerShape;
  detectedHardware?: string;
  contentFlag?: 'safe' | 'pii' | 'inappropriate';
}

// Image data structure
export interface ImageData {
  data: string; // base64
  mimeType: string;
  width?: number;
  height?: number;
}

// Visualization generation request
export interface VisualizationRequest {
  bathroomImage: ImageData;
  inspirationImage?: ImageData;
  /**
   * Authoritative product reference images appended to the multimodal input
   * after the bathroom + inspiration photos. Currently used to anchor the
   * model to a correct rendering of pivot doors (top-and-bottom hardware,
   * bare vertical edges) — a door type the base model often substitutes
   * with a hinged door. Each entry should include a `description` field on
   * the wrapping array element that explains what the image is for; the
   * API handler will inject the descriptions into the text prompt so the
   * model knows how to use each reference and what NOT to copy from it.
   */
  referenceImages?: ReferenceImage[];
  prompt: string;
  targetWidth?: number;
  targetHeight?: number;
}

// Wrapper for an authoritative reference image plus its explanatory blurb.
export interface ReferenceImage {
  image: ImageData;
  /** Short human-readable label used to identify the image in logs. */
  label: string;
  /**
   * Prose explanation injected into the text prompt right before the image,
   * telling the model what the image is, what to copy from it, and what to
   * ignore (e.g., labels, background, tile, color of the surrounding scene).
   */
  description: string;
}

// Visualization generation response
export interface VisualizationResponse {
  image: string; // data URL
}

// API error response
export interface APIError {
  error: string;
  details?: string;
}
