// Visualizer types (Gatsby Glass specific -- kept for backward compatibility)
// New brands should define their own product types in their app directory.
export type {
  DesignMode,
  EnclosureType,
  ShowerShape,
  GlassStyle,
  HardwareFinish,
  HandleStyle,
  TrackPreference,
  DoorDirection,
  SlidingDirection,
  SlidingConfiguration,
  DoorOpening,
  HingedConfig,
  PivotConfig,
  SlidingConfig,
  OptionalConfig,
  Payload,
  Configs,
  HistoryItem,
  SavedDesign,
} from './visualizer';

// Lead types (Gatsby Glass specific versions)
export type {
  ContactFormData,
  Lead,
  LeadSubmissionResponse,
  GenerationRecord,
  IssueReport,
} from './leads';

// Generic lead types (for new brands -- use these instead of the above)
export type {
  GenericContactFormData,
  GenericLead,
  GenericGenerationRecord,
  GenericVisualizationData,
} from './generic-leads';

// API types
export type {
  ImageValidationResponse,
  ImageData,
  VisualizationRequest,
  VisualizationResponse,
  APIError,
} from './api';

// Generic API types (for new brands -- use these instead of the above)
export type {
  GenericImageValidationResponse,
} from './generic-api';
