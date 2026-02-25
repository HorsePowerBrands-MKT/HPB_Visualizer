import { ShowerShape } from './visualizer';

// Image validation response
export interface ImageValidationResponse {
  valid: boolean;
  reason?: string;
  shape: ShowerShape;
  detectedHardware?: string;
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
  prompt: string;
  targetWidth?: number;
  targetHeight?: number;
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
