// Hooks
export { useVisualizerState } from './hooks/useVisualizerState';
export type { VisualizerState, VisualizerActions } from './hooks/useVisualizerState';

// Utilities
export {
  fileToBase64,
  fileToBase64Data,
  validateImageSize,
  validateImageType,
  createPreviewUrl,
  revokePreviewUrl,
  compressImage
} from './utils/imageProcessing';

export {
  buildVisualizationPrompt,
  buildInspirationPrompt
} from './utils/promptBuilder';
