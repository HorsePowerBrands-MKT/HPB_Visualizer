export type {
  RoomEnclosureMode,
  RoomEnclosureApplication,
  RoomEnclosureStyle,
  RoomEnclosureFinish,
  RoomEnclosureExistingCondition,
  RoomEnclosurePlacementPoint,
  RoomEnclosurePlacementPath,
  RoomEnclosurePlacement,
  RoomEnclosureForm,
  RoomEnclosurePayload,
  RoomEnclosurePromptSelection,
  RoomEnclosurePromptInput,
  RoomEnclosureHistoryItem,
} from './types';

export {
  ROOM_ENCLOSURE_CATALOG,
  ROOM_ENCLOSURE_CATALOG_VERSION,
  ROOM_ENCLOSURE_APPLICATION_ORDER,
  ROOM_ENCLOSURE_STYLE_ORDER,
  ROOM_ENCLOSURE_FINISH_ORDER,
  roomEnclosureApplications,
  roomEnclosureStyles,
  roomEnclosureFinishes,
  roomEnclosureFinishSwatches,
  formatRoomEnclosureSummary,
  type RoomEnclosureCatalogEntry,
} from './catalog';

export { ROOM_ENCLOSURE_STYLE_OPTION_ICONS } from './optionIcons';

export {
  isRoomEnclosurePlacementReady,
  isRoomEnclosureFormComplete,
  buildRoomEnclosurePayload,
  buildRoomEnclosurePromptInput,
} from './promptInput';

export {
  renderPlacementReferenceImage,
  drawPlacementPath,
  isPlacementPathComplete,
  placementWallCount,
  pointDistance,
  clampUnit,
  MIN_SEGMENT_LENGTH,
  PLACEMENT_LINE_COLOR,
  PLACEMENT_LINE_OUTLINE,
} from './placementImage';

export {
  buildRoomEnclosurePrompt,
  buildRoomEnclosureSystemPrompt,
  getRoomEnclosureValidationPrompt,
  roomEnclosurePromptVariables,
  ROOM_ENCLOSURE_EDIT_PREAMBLE,
} from './promptBuilder';

export {
  APPROVED_ROOM_ENCLOSURE_STYLES,
  APPROVED_ROOM_ENCLOSURE_APPLICATIONS,
  APPROVED_ROOM_ENCLOSURE_FINISHES,
  UNSUPPORTED_ENCLOSURE_TYPES,
  PLACEMENT_PATH_RULES,
  PLACEMENT_REFERENCE_DESCRIPTION,
  requiresPlacementPath,
  validateRoomEnclosureSelections,
  assertRoomEnclosureSelectionsRenderable,
  RoomEnclosureRuleViolationError,
  type RoomEnclosureRuleIssue,
  type UnsupportedEnclosureType,
} from './rules';
