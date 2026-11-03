export type {
  RailingMode,
  RailingApplication,
  RailingSetting,
  RailingSystem,
  RailingHandrail,
  RailingFinish,
  RailingExistingCondition,
  RailingForm,
  RailingPayload,
  RailingPromptSelection,
  RailingPromptInput,
  RailingHistoryItem,
} from './types';

export {
  RAILING_CATALOG,
  RAILING_CATALOG_VERSION,
  RAILING_APPLICATION_ORDER,
  RAILING_SYSTEM_ORDER,
  RAILING_HANDRAIL_ORDER,
  RAILING_FINISH_ORDER,
  railingApplications,
  railingSystems,
  railingHandrailOptions,
  railingFinishes,
  railingFinishSwatches,
  formatRailingSummary,
  type RailingCatalogEntry,
  type RailingApplicationEntry,
} from './catalog';

export {
  RAILING_SYSTEM_OPTION_ICONS,
  RAILING_HANDRAIL_OPTION_ICONS,
} from './optionIcons';

export {
  isRailingFormComplete,
  buildRailingPayload,
  buildRailingPromptInput,
} from './promptInput';

export {
  buildRailingPrompt,
  buildRailingSystemPrompt,
  getRailingValidationPrompt,
  railingPromptVariables,
  RAILING_EDIT_PREAMBLE,
} from './promptBuilder';

export {
  APPROVED_RAILING_SYSTEMS,
  APPROVED_HANDRAILS,
  APPROVED_FINISHES,
  SYSTEM_HANDRAIL_COMPATIBILITY,
  UNSUPPORTED_RAILING_TYPES,
  validateRailingSelections,
  assertRailingSelectionsRenderable,
  RailingRuleViolationError,
  type RailingRuleIssue,
  type UnsupportedRailingType,
} from './rules';
