import { ShowerShape } from './visualizer';

// Image validation response
export interface ImageValidationResponse {
  valid: boolean;
  reason?: string;
  shape: ShowerShape;
}

// Image data structure
export interface ImageData {
  data: string; // base64
  mimeType: string;
}

// Visualization generation request
export interface VisualizationRequest {
  bathroomImage: ImageData;
  inspirationImage?: ImageData;
  prompt: string;
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
