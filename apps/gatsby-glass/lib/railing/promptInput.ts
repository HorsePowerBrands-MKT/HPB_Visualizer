/**
 * Resolves completed railing selections into the structured input the
 * backend prompt layer consumes. Pure functions, no React.
 */

import type {
  RailingForm,
  RailingPayload,
  RailingPromptInput,
  RailingPromptSelection,
} from './types';
import {
  railingApplications,
  railingSystems,
  railingHandrailOptions,
  railingFinishes,
  RAILING_CATALOG_VERSION,
} from './catalog';
import { assertRailingSelectionsRenderable } from './rules';

/**
 * True once every consumer selection the current mode needs has been made.
 * Design Your Own needs all four; Match Inspiration only needs Application
 * (the inspiration photo supplies system, handrail and finish unless the
 * consumer explicitly overrides them).
 */
export const isRailingFormComplete = (form: RailingForm): boolean => {
  if (form.application === null) return false;
  if (form.mode === 'inspiration') return true;
  return form.railing_system !== null && form.handrail !== null && form.finish !== null;
};

/** Builds the payload from a completed form. Returns null if anything is missing. */
export const buildRailingPayload = (
  form: RailingForm,
  sessionId: string
): RailingPayload | null => {
  if (!isRailingFormComplete(form) || form.application === null) return null;
  return {
    product: 'railing',
    mode: form.mode,
    application: form.application,
    railing_system: form.railing_system,
    handrail: form.handrail,
    finish: form.finish,
    existing_condition: form.existing_condition ?? 'none',
    session_id: sessionId,
    catalog_version: RAILING_CATALOG_VERSION,
  };
};

const select = <T extends string>(
  id: T | null,
  catalog: Record<T, { name: string; promptDescriptor: string }>
): RailingPromptSelection<T> | null =>
  id === null
    ? null
    : { id, name: catalog[id].name, prompt_descriptor: catalog[id].promptDescriptor };

/**
 * Resolves catalog ids to the backend-facing descriptors the prompt layer
 * needs. Throws `RailingRuleViolationError` for any selection outside the
 * approved families (see ./rules.ts), so unsupported railing types are
 * blocked before prompt assembly.
 */
export const buildRailingPromptInput = (payload: RailingPayload): RailingPromptInput => {
  assertRailingSelectionsRenderable(payload);
  const application = railingApplications[payload.application];

  return {
    product: 'railing',
    catalog_version: payload.catalog_version,
    session_id: payload.session_id,
    mode: payload.mode,
    setting: application.setting,
    existing_condition: payload.existing_condition,
    application: {
      id: payload.application,
      name: application.name,
      prompt_descriptor: application.promptDescriptor,
    },
    railing_system: select(payload.railing_system, railingSystems),
    handrail: select(payload.handrail, railingHandrailOptions),
    finish: select(payload.finish, railingFinishes),
  };
};
