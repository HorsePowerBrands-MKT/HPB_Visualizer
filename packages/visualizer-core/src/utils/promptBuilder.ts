import type { Payload } from '@repo/types';
import {
  buildVisualizationPromptFromTemplate,
  buildInspirationPromptFromTemplate,
  cachePrompt,
  type ProcessedPrompt,
} from '@repo/prompt-templates';

/**
 * Build a detailed prompt for AI visualization generation
 * 
 * This function now uses the JSON-based template system.
 * The template can be edited at: packages/prompt-templates/templates/visualization-v1.json
 * 
 * @param config - The visualization configuration payload
 * @returns The generated prompt string
 */
export function buildVisualizationPrompt(config: Payload): string {
  const result = buildVisualizationPromptFromTemplate(config as unknown as Record<string, unknown>);
  
  // Cache the prompt for reuse tracking
  cachePrompt(result, config as unknown as Record<string, unknown>);
  
  return result.text;
}

/**
 * Build a detailed prompt for AI visualization generation with full result
 * 
 * This version returns the full ProcessedPrompt object including metadata,
 * hash, and resolved variables for debugging or logging purposes.
 * 
 * @param config - The visualization configuration payload
 * @returns The full ProcessedPrompt result
 */
export function buildVisualizationPromptWithMetadata(config: Payload): ProcessedPrompt {
  const result = buildVisualizationPromptFromTemplate(config as unknown as Record<string, unknown>);
  cachePrompt(result, config as unknown as Record<string, unknown>);
  return result;
}

/**
 * Build an inspiration matching prompt
 * 
 * This function now uses the JSON-based template system.
 * The template can be edited at: packages/prompt-templates/templates/inspiration-v1.json
 * 
 * @param showerShape - The detected shower shape
 * @returns The generated prompt string
 */
export function buildInspirationPrompt(showerShape: string): string {
  const result = buildInspirationPromptFromTemplate(showerShape);
  
  // Cache the prompt for reuse tracking
  cachePrompt(result, { shower_shape: showerShape });
  
  return result.text;
}

/**
 * Build an inspiration matching prompt with full result
 * 
 * This version returns the full ProcessedPrompt object including metadata.
 * 
 * @param showerShape - The detected shower shape
 * @returns The full ProcessedPrompt result
 */
export function buildInspirationPromptWithMetadata(showerShape: string): ProcessedPrompt {
  const result = buildInspirationPromptFromTemplate(showerShape);
  cachePrompt(result, { shower_shape: showerShape });
  return result;
}
