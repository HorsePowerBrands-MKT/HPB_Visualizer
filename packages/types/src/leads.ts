import { EnclosureType, GlassStyle, HardwareFinish, ShowerShape, TrackPreference, HandleStyle, DesignMode, HingedConfig, PivotConfig, SlidingConfig } from './visualizer';

// Contact form data
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  zipCode: string;
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
}

// Lead submission response
export interface LeadSubmissionResponse {
  success: boolean;
  message: string;
  leadId?: string;
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
}

// Issue report data (many per session)
export interface IssueReport {
  sessionId: string;
  issueMessage: string;
  visualizationImageUrl?: string;
  team?: string;
}
