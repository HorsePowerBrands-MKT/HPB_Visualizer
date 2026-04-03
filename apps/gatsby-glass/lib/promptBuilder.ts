/**
 * Gatsby Glass Prompt Builders
 *
 * Brand-specific wrappers around the shared template processor.
 * These enrich the config with Gatsby-specific option descriptions
 * and catalog data before calling the shared processor.
 * Other brands will create their own equivalent builders.
 */

import type { Payload } from '@repo/types';
import {
  buildVisualizationPromptFromTemplate,
  buildInspirationPromptFromTemplate,
  cachePrompt,
  type ProcessedPrompt,
} from '@repo/prompt-templates';
import {
  doorTypeDescriptions,
  glassStyleDescriptions,
  hardwareFinishDescriptions,
  handleStyleDescriptions,
  framingDescriptions,
} from '../prompts/gatsby-options';
import { CATALOG } from './gatsby-constants/src/catalog';

function enrichConfigWithDescriptions(config: Payload): Record<string, unknown> {
  const enriched = config as unknown as Record<string, unknown>;
  enriched.door_type_description =
    doorTypeDescriptions[config.enclosure_type as keyof typeof doorTypeDescriptions]?.description ?? '';
  enriched.glass_style_description =
    glassStyleDescriptions[config.glass_style as keyof typeof glassStyleDescriptions]?.description ?? '';
  enriched.hardware_finish_description =
    hardwareFinishDescriptions[config.hardware_finish as keyof typeof hardwareFinishDescriptions]?.description ?? '';
  enriched.handle_style_description =
    handleStyleDescriptions[config.handle_style as keyof typeof handleStyleDescriptions]?.description ?? '';
  enriched.framing_description =
    framingDescriptions[config.track_preference as keyof typeof framingDescriptions]?.description ?? '';
  return enriched;
}

const processorOptions = { catalog: CATALOG };

export function buildVisualizationPrompt(config: Payload): string {
  const enriched = enrichConfigWithDescriptions(config);
  const result = buildVisualizationPromptFromTemplate(enriched, processorOptions);
  cachePrompt(result, enriched);
  return result.text;
}

export function buildVisualizationPromptWithMetadata(config: Payload): ProcessedPrompt {
  const enriched = enrichConfigWithDescriptions(config);
  const result = buildVisualizationPromptFromTemplate(enriched, processorOptions);
  cachePrompt(result, enriched);
  return result;
}

export function buildInspirationPrompt(showerShape: string): string {
  const result = buildInspirationPromptFromTemplate(showerShape, processorOptions);
  cachePrompt(result, { shower_shape: showerShape });
  return result.text;
}

export function buildInspirationPromptWithMetadata(showerShape: string): ProcessedPrompt {
  const result = buildInspirationPromptFromTemplate(showerShape, processorOptions);
  cachePrompt(result, { shower_shape: showerShape });
  return result;
}
