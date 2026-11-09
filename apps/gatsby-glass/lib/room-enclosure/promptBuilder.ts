/**
 * Gatsby Glass Room Enclosure prompt builders
 *
 * Thin wrappers around the shared template processor for the room enclosure
 * templates in `prompts/room-enclosure-templates.ts`. The consumer prompt is
 * built on the client (like the shower and railing flows); the system
 * prompt, validation prompt and edit preamble are resolved server-side by
 * the API routes.
 *
 * Safe to import from both client and server code.
 */

// IMPORTANT: registers the brand templates (shower + railing + room
// enclosure) before any template lookup. Idempotent.
import '../registerTemplates';
import { getTemplateById, processTemplate, cachePrompt } from '@repo/prompt-templates';
import type { RoomEnclosurePromptInput, RoomEnclosurePayload } from './types';
import { assertRoomEnclosureSelectionsRenderable } from './rules';
import {
  ROOM_ENCLOSURE_VISUALIZATION_TEMPLATE_ID,
  ROOM_ENCLOSURE_SYSTEM_TEMPLATE_ID,
  ROOM_ENCLOSURE_VALIDATION_TEMPLATE_ID,
} from '../../prompts/room-enclosure-templates';

/**
 * Flattens the structured prompt input into the flat variable map the
 * template conditions and `{{placeholders}}` read. Optional selections are
 * left undefined so `equals` / `exists` conditions skip their sections.
 */
export function roomEnclosurePromptVariables(input: RoomEnclosurePromptInput): Record<string, unknown> {
  return {
    mode: input.mode,
    existing_condition: input.existing_condition,
    placement: input.placement,
    placement_name:
      input.placement === 'drawn'
        ? 'customer-drawn floor path, one glass wall per segment (see the placement reference image)'
        : 'inferred from the opening in input_1',
    application: input.application.id,
    application_name: input.application.name,
    application_descriptor: input.application.prompt_descriptor,
    style: input.style?.id,
    style_name: input.style?.name,
    style_descriptor: input.style?.prompt_descriptor,
    finish: input.finish?.id,
    finish_name: input.finish?.name,
    finish_descriptor: input.finish?.prompt_descriptor,
  };
}

/** Re-derives the id-level payload the rules validate from a resolved prompt input. */
function payloadFromInput(input: RoomEnclosurePromptInput): RoomEnclosurePayload {
  return {
    product: 'room_enclosure',
    mode: input.mode,
    application: input.application.id,
    style: input.style?.id ?? null,
    finish: input.finish?.id ?? null,
    existing_condition: input.existing_condition,
    placement: input.placement,
    session_id: input.session_id,
    catalog_version: input.catalog_version,
  };
}

/**
 * The consumer-facing generation prompt (hidden from the consumer).
 * Throws `RoomEnclosureRuleViolationError` if the selections fall outside
 * the approved families, so unsupported enclosure types never reach the model.
 */
export function buildRoomEnclosurePrompt(input: RoomEnclosurePromptInput): string {
  assertRoomEnclosureSelectionsRenderable(payloadFromInput(input));
  const variables = roomEnclosurePromptVariables(input);
  const result = processTemplate(getTemplateById(ROOM_ENCLOSURE_VISUALIZATION_TEMPLATE_ID), variables);
  cachePrompt(result, variables);
  return result.text;
}

/** System instruction for room enclosure renders (server-side). */
export function buildRoomEnclosureSystemPrompt(): string {
  return processTemplate(getTemplateById(ROOM_ENCLOSURE_SYSTEM_TEMPLATE_ID), {}).text;
}

/** Image validation prompt for room enclosure uploads (server-side). */
export function getRoomEnclosureValidationPrompt(): string {
  return processTemplate(getTemplateById(ROOM_ENCLOSURE_VALIDATION_TEMPLATE_ID), {}).text;
}

/**
 * Short edit-mandate block placed before input_1 so the model is anchored on
 * "edit this photo, install the enclosure" before it sees any image. Mirrors
 * the shower preamble in `@repo/api-handlers/gemini` and the railing preamble.
 */
export const ROOM_ENCLOSURE_EDIT_PREAMBLE = [
  'EDIT TASK — READ THIS BEFORE LOOKING AT ANY IMAGE.',
  '',
  'The very next image (input_1) is a photo of an interior space: a wine',
  'room or wine wall, the space beneath a staircase, a home office, a',
  'lounge, or another room or alcove. Your output MUST be a modified',
  'version of input_1 with a NEW full-height glass enclosure (glass wall',
  'panels plus a glass door) installed across the opening that closes off',
  'that space. The output must NOT be identical to input_1 — a render that',
  'returns the input unchanged (no glass panels visible, no door or',
  'hardware visible) is a FAILED render and you must redo it.',
  '',
  'Any additional images that follow input_1 are reference material',
  '(an inspiration photo and/or product references). They are NEVER the',
  'canvas to render into — input_1 is the only canvas.',
  '',
  'After all images you will receive a structured ENCLOSURE_SPECIFICATION',
  'describing exactly what to install and what to preserve. It is',
  'non-negotiable. But the master rule is this single short paragraph:',
  'edit input_1, do not preserve it.',
].join('\n');
