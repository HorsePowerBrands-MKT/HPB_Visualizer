import { EnclosureType, GlassStyle, HardwareFinish, ShowerShape, TrackPreference, HandleStyle, DesignMode, HingedConfig, PivotConfig, SlidingConfig } from './visualizer';

// Contact form data
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  zipCode: string;
}

/**
 * Product-specific selections stored on a lead for non-shower product lines.
 * Mirrors the shape of `visualizations.product_config` so the lead row and the
 * generation rows agree. All keys optional: inspiration-mode railing leads may
 * leave system/handrail/finish null.
 */
export interface LeadProductConfig {
  mode?: 'configure' | 'inspiration' | null;
  application?: string | null;
  railing_system?: string | null;
  handrail?: string | null;
  finish?: string | null;
  existing_condition?: string | null;
  catalog_version?: string | null;
}

// Lead submission data
export interface Lead extends ContactFormData {
  visualizationImage?: string;
  originalImage?: string;
  doorType?: EnclosureType;
  finish?: GlassStyle;
  hardware?: HardwareFinish;
  showerShape?: ShowerShape;
  source?: string;
  status?: 'new' | 'contacted' | 'quoted' | 'closed';
  trackPreference?: TrackPreference;
  handleStyle?: HandleStyle;
  mode?: DesignMode;
  sessionId?: string;
  issueReported?: boolean;
  issueMessage?: string;
  contactSubmitted?: boolean;
  tcpaConsent?: boolean;
  tcpaConsentText?: string;
  consentIp?: string;
  consentUserAgent?: string;
  userFingerprint?: string;
  userId?: string;
  locationId?: string;
  locationName?: string;
  leadType?: 'SAS' | 'RAQ' | 'POP';
  /** Product line the lead came from. Absent = shower. */
  product?: 'shower' | 'railing';
  /** Human-readable selections for non-shower products (used in emails). */
  productSummary?: string;
  /** Structured selections for non-shower products (stored as product_config). */
  productConfig?: LeadProductConfig | null;
}

// A single visualization image collected for a session/user, with the
// configuration that produced it. Stored on the lead row and used when
// composing the SAS email so each image can be labeled in the gallery.
export interface VisualizationHistoryItem {
  watermarked: string | null;
  original: string | null;
  created_at: string;
  mode?: DesignMode | null;
  enclosure_type?: EnclosureType | null;
  framing_style?: TrackPreference | null;
  hardware_finish?: HardwareFinish | null;
  handle_style?: HandleStyle | null;
  /** 'shower' | 'railing'. Absent/null = shower (legacy rows). */
  product?: string | null;
  /** Product-specific selections for non-shower rows. */
  product_config?: Record<string, unknown> | null;
}

// Lead submission response
export interface LeadSubmissionResponse {
  success: boolean;
  message: string;
  leadId?: string;
  /** Full session/user visualization history (oldest first). Only populated
   *  on successful submissions. Used by the route handler to compose the
   *  customer-facing SAS email without a second DB round-trip. */
  allVisualizationUrls?: VisualizationHistoryItem[];
}

// Visualization auto-save data (without contact info)
export interface VisualizationData {
  sessionId: string;
  mode: DesignMode;
  enclosureType?: EnclosureType;
  glassStyle?: GlassStyle;
  hardwareFinish?: HardwareFinish;
  handleStyle?: HandleStyle;
  trackPreference?: TrackPreference;
  showerShape?: ShowerShape;
  visualizationImage?: string;
  originalImage?: string;
  source?: string;
  team?: string;
}

// A single image generation event (many per session)
export interface GenerationRecord {
  sessionId: string;
  generationIndex: number;  // 1 for first, 2 for re-generate, etc.
  mode?: DesignMode;
  enclosureType?: EnclosureType;
  framingStyle?: TrackPreference;
  hardwareFinish?: HardwareFinish;
  handleStyle?: HandleStyle;
  showerShape?: ShowerShape;
  // Door sub-option configs (stored as JSONB so queries can dig into them)
  hingedConfig?: HingedConfig;
  pivotConfig?: PivotConfig;
  slidingConfig?: SlidingConfig;
  visualizationImageUrl?: string;
  originalImageUrl?: string;
  team?: string;
  userFingerprint?: string;
  userId?: string;
  /** Product line. Absent = 'shower'. */
  product?: 'shower' | 'railing';
  /** Product-specific selections (stored as JSONB). */
  productConfig?: Record<string, unknown>;
}

// Issue report data (many per session)
export interface IssueReport {
  sessionId: string;
  issueMessage: string;
  visualizationImageUrl?: string;
  team?: string;
}

// Visualizer submission with consent-driven photo storage
export interface VisualizerSubmission {
  id: string;
  createdAt: string;
  expiresAt: string;
  originalPhotoPath: string;
  generatedImagePath: string | null;
  uploadConsent: boolean;
  marketingConsent: boolean;
  sourceUrl: string | null;
  metadata: Record<string, unknown>;
}

// Data needed to create a new submission
export interface VisualizerSubmissionInput {
  originalPhotoPath: string;
  uploadConsent: boolean;
  marketingConsent: boolean;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}
