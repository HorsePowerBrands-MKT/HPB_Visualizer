/**
 * Resolves completed room enclosure selections into the structured input the
 * backend prompt layer consumes. Pure functions, no React.
 */

import type {
  RoomEnclosureForm,
  RoomEnclosurePayload,
  RoomEnclosurePromptInput,
  RoomEnclosurePromptSelection,
} from './types';
import {
  roomEnclosureApplications,
  roomEnclosureStyles,
  roomEnclosureFinishes,
  ROOM_ENCLOSURE_CATALOG_VERSION,
} from './catalog';
import { assertRoomEnclosureSelectionsRenderable, requiresPlacementPath } from './rules';
import { isPlacementPathComplete } from './placementImage';

/**
 * True once the photo side of the form is settled: the room type is known
 * and, when the photo has nothing to anchor the glass to, the consumer has
 * drawn a complete placement path. A half-drawn path (one corner tapped)
 * never counts, whether or not the path is required.
 */
export const isRoomEnclosurePlacementReady = (form: RoomEnclosureForm): boolean => {
  if (form.application === null) return false;
  if (form.placement_path !== null) return isPlacementPathComplete(form.placement_path);
  return !requiresPlacementPath(form.existing_condition);
};

/**
 * True once every consumer selection the current mode needs has been made.
 * Design Your Own needs the room type, placement, style and finish; Match
 * Inspiration only needs the room type and placement (the inspiration photo
 * supplies style and finish unless the consumer explicitly overrides them).
 */
export const isRoomEnclosureFormComplete = (form: RoomEnclosureForm): boolean => {
  if (!isRoomEnclosurePlacementReady(form)) return false;
  if (form.mode === 'inspiration') return true;
  return form.style !== null && form.finish !== null;
};

/** Builds the payload from a completed form. Returns null if anything is missing. */
export const buildRoomEnclosurePayload = (
  form: RoomEnclosureForm,
  sessionId: string
): RoomEnclosurePayload | null => {
  if (!isRoomEnclosureFormComplete(form) || form.application === null) return null;
  return {
    product: 'room_enclosure',
    mode: form.mode,
    application: form.application,
    style: form.style,
    finish: form.finish,
    existing_condition: form.existing_condition ?? 'none',
    placement: isPlacementPathComplete(form.placement_path) ? 'drawn' : 'inferred',
    session_id: sessionId,
    catalog_version: ROOM_ENCLOSURE_CATALOG_VERSION,
  };
};

const select = <T extends string>(
  id: T | null,
  catalog: Record<T, { name: string; promptDescriptor: string }>
): RoomEnclosurePromptSelection<T> | null =>
  id === null
    ? null
    : { id, name: catalog[id].name, prompt_descriptor: catalog[id].promptDescriptor };

/**
 * Resolves catalog ids to the backend-facing descriptors the prompt layer
 * needs. Throws `RoomEnclosureRuleViolationError` for any selection outside
 * the approved families (see ./rules.ts), so unsupported enclosure types are
 * blocked before prompt assembly.
 */
export const buildRoomEnclosurePromptInput = (
  payload: RoomEnclosurePayload
): RoomEnclosurePromptInput => {
  assertRoomEnclosureSelectionsRenderable(payload);
  const application = roomEnclosureApplications[payload.application];

  return {
    product: 'room_enclosure',
    catalog_version: payload.catalog_version,
    session_id: payload.session_id,
    mode: payload.mode,
    existing_condition: payload.existing_condition,
    placement: payload.placement,
    application: {
      id: payload.application,
      name: application.name,
      prompt_descriptor: application.promptDescriptor,
    },
    style: select(payload.style, roomEnclosureStyles),
    finish: select(payload.finish, roomEnclosureFinishes),
  };
};
