/**
 * Gatsby Glass Prompt Builders
 *
 * Brand-specific wrappers around the shared template processor.
 * These use the Gatsby Glass Payload type and template definitions.
 * Other brands will create their own equivalent builders.
 */

import type { Payload } from '@repo/types';
import {
  buildVisualizationPromptFromTemplate,
  buildInspirationPromptFromTemplate,
  cachePrompt,
  type ProcessedPrompt,
} from '@repo/prompt-templates';

export function buildVisualizationPrompt(config: Payload): string {
  const result = buildVisualizationPromptFromTemplate(config as unknown as Record<string, unknown>);
  cachePrompt(result, config as unknown as Record<string, unknown>);
  return result.text;
}

export function buildVisualizationPromptWithMetadata(config: Payload): ProcessedPrompt {
  const result = buildVisualizationPromptFromTemplate(config as unknown as Record<string, unknown>);
  cachePrompt(result, config as unknown as Record<string, unknown>);
  return result;
}

export function buildInspirationPrompt(showerShape: string): string {
  const result = buildInspirationPromptFromTemplate(showerShape);
  cachePrompt(result, { shower_shape: showerShape });
  return result.text;
}

export function buildInspirationPromptWithMetadata(showerShape: string): ProcessedPrompt {
  const result = buildInspirationPromptFromTemplate(showerShape);
  cachePrompt(result, { shower_shape: showerShape });
  return result;
}
