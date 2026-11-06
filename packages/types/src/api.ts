import { ShowerShape } from './visualizer';

// Image validation response
export interface ImageValidationResponse {
  valid: boolean;
  reason?: string;
  shape: ShowerShape;
  detectedHardware?: string;
  contentFlag?: 'safe' | 'pii' | 'inappropriate';
}

/** Product line a request belongs to. Absent = 'shower' (legacy default). */
export type VisualizerProduct = 'shower' | 'railing' | 'room_enclosure';

/** What the railing validator saw at the railing location in the photo. */
export type RailingExistingCondition =
  | 'existing_railing'
  | 'open_edge'
  | 'half_wall'
  | 'existing_fence'
  | 'none';

/** Which railing application the validator believes the photo shows. */
export type RailingDetectedApplication =
  | 'interior_staircase'
  | 'interior_balcony'
  | 'exterior_deck'
  | 'pool_balustrade'
  | 'unknown';

// Railing image validation response
export interface RailingImageValidationResponse {
  valid: boolean;
  reason?: string;
  setting: 'interior' | 'exterior';
  existingCondition: RailingExistingCondition;
  /** Auto-detected so the consumer never has to pick where the railing goes. */
  detectedApplication: RailingDetectedApplication;
  contentFlag?: 'safe' | 'pii' | 'inappropriate';
}

/** What the room enclosure validator saw at the enclosure location in the photo. */
export type RoomEnclosureExistingCondition =
  | 'open_opening'
  | 'existing_partition'
  | 'existing_glass'
  | 'open_floor'
  | 'none';

/** Which room type the room enclosure validator believes the photo shows. */
export type RoomEnclosureDetectedApplication =
  | 'wine_room'
  | 'under_stair'
  | 'home_office'
  | 'other_room'
  | 'unknown';

// Room enclosure image validation response
export interface RoomEnclosureImageValidationResponse {
  valid: boolean;
  reason?: string;
  existingCondition: RoomEnclosureExistingCondition;
  /** Auto-detected so the consumer never has to pick what the room is for. */
  detectedApplication: RoomEnclosureDetectedApplication;
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
  /**
   * Overrides the registered system template for this request. Absent =
   * the brand's active 'system' template (shower). Set by the API route
   * for non-shower products.
   */
  systemPrompt?: string;
  /**
   * Overrides the short "EDIT TASK" preamble placed before input_1. Absent =
   * the shower preamble. Set by the API route for non-shower products.
   */
  editPreamble?: string;
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
