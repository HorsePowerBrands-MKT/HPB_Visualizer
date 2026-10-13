/**
 * Gatsby Glass Railing prompt builders
 *
 * Thin wrappers around the shared template processor for the railing
 * templates in `prompts/railing-templates.ts`. The consumer prompt is built
 * on the client (like the shower flow); the system prompt, validation
 * prompt and edit preamble are resolved server-side by the API routes.
 *
 * Safe to import from both client and server code.
 */

// IMPORTANT: registers the brand templates (shower + railing) before any
// template lookup. Idempotent.
import '../registerTemplates';
import { getTemplateById, processTemplate, cachePrompt } from '@repo/prompt-templates';
import type { RailingPromptInput, RailingPayload } from './types';
import { assertRailingSelectionsRenderable } from './rules';
import {
  RAILING_VISUALIZATION_TEMPLATE_ID,
  RAILING_SYSTEM_TEMPLATE_ID,
  RAILING_VALIDATION_TEMPLATE_ID,
} from '../../prompts/railing-templates';

/**
 * Flattens the structured prompt input into the flat variable map the
 * template conditions and `{{placeholders}}` read. Optional selections are
 * left undefined so `equals` / `exists` conditions skip their sections.
 */
export function railingPromptVariables(input: RailingPromptInput): Record<string, unknown> {
  return {
    mode: input.mode,
    setting: input.setting,
    existing_condition: input.existing_condition,
    application: input.application.id,
    application_name: input.application.name,
    application_descriptor: input.application.prompt_descriptor,
    railing_system: input.railing_system?.id,
    system_name: input.railing_system?.name,
    system_descriptor: input.railing_system?.prompt_descriptor,
    handrail: input.handrail?.id,
    handrail_name: input.handrail?.name,
    handrail_descriptor: input.handrail?.prompt_descriptor,
    finish: input.finish?.id,
    finish_name: input.finish?.name,
    finish_descriptor: input.finish?.prompt_descriptor,
  };
}

/**
 * The consumer-facing generation prompt (hidden from the consumer).
 * Throws `RailingRuleViolationError` if the selections fall outside the
 * approved families, so unsupported railing types never reach the model.
 */
export function buildRailingPrompt(input: RailingPromptInput): string {
  assertRailingSelectionsRenderable(payloadFromInput(input));
  const variables = railingPromptVariables(input);
  const result = processTemplate(getTemplateById(RAILING_VISUALIZATION_TEMPLATE_ID), variables);
  cachePrompt(result, variables);
  return result.text;
}

/** System instruction for railing renders (server-side). */
export function buildRailingSystemPrompt(): string {
  return processTemplate(getTemplateById(RAILING_SYSTEM_TEMPLATE_ID), {}).text;
}

/** Image validation prompt for railing uploads (server-side). */
export function getRailingValidationPrompt(): string {
  return processTemplate(getTemplateById(RAILING_VALIDATION_TEMPLATE_ID), {}).text;
}

/**
 * Short edit-mandate block placed before input_1 so the model is anchored on
 * "edit this photo, install the railing" before it sees any image. Mirrors
 * the shower preamble in `@repo/api-handlers/gemini`.
 */
/** Re-derives the id-level payload the rules validate from a resolved prompt input. */
function payloadFromInput(input: RailingPromptInput): RailingPayload {
  return {
    product: 'railing',
    mode: input.mode,
    application: input.application.id,
    railing_system: input.railing_system?.id ?? null,
    handrail: input.handrail?.id ?? null,
    finish: input.finish?.id ?? null,
    existing_condition: input.existing_condition,
    session_id: input.session_id,
    catalog_version: input.catalog_version,
  };
}

export const RAILING_EDIT_PREAMBLE = [
  'EDIT TASK — READ THIS BEFORE LOOKING AT ANY IMAGE.',
  '',
  'The very next image (input_1) is a photo of a staircase, balcony, loft,',
  'deck, patio, porch, or pool area. Your output MUST be a modified version',
  'of input_1 with a NEW frameless glass railing installed along the',
  'existing railing line, guard line, or open edge. The output must NOT be',
  'identical to input_1 — a render that returns the input unchanged (no',
  'glass panels visible, no railing hardware visible) is a FAILED render',
  'and you must redo it.',
  '',
  'Any additional images that follow input_1 are reference material',
  '(an inspiration photo and/or product references). They are NEVER the',
  'canvas to render into — input_1 is the only canvas.',
  '',
  'After all images you will receive a structured RAILING_SPECIFICATION',
  'describing exactly what to install and what to preserve. It is',
  'non-negotiable. But the master rule is this single short paragraph:',
  'edit input_1, do not preserve it.',
].join('\n');
