// Design mode types
export type DesignMode = 'configure' | 'inspiration';

// Enclosure/Door types
export type EnclosureType = 'hinged' | 'pivot' | 'sliding';

// Shower shape types (detected from image)
export type ShowerShape = 'standard' | 'neo_angle' | 'tub';

// Glass style options
export type GlassStyle = 'clear' | 'low_iron' | 'p516';

// Hardware finish options
export type HardwareFinish = 'chrome' | 'brushed_nickel' | 'matte_black' | 'polished_brass' | 'oil_rubbed_bronze';

// Handle style options
export type HandleStyle = 'ladder' | 'square' | 'd_pull' | 'knob';

// Track/framing preference
export type TrackPreference = 'frameless' | 'semi_frameless' | 'framed';

// Door direction for hinged/pivot doors
export type DoorDirection = 'left' | 'right' | 'double';

// Sliding door direction
export type SlidingDirection = 'left' | 'right';

// Sliding door configuration count
export type SlidingConfiguration = 'single' | 'double';

// Door opening configuration
export interface DoorOpening {
  type: EnclosureType;
  side: 'left' | 'right' | null;
  swing: 'in' | 'out' | null;
}

// Hinged door sub-options
export interface HingedConfig {
  to_ceiling: boolean;
  direction: DoorDirection;
}

// Pivot door sub-options
export interface PivotConfig {
  direction: DoorDirection;
}

// Sliding door sub-options
export interface SlidingConfig {
  configuration: SlidingConfiguration;
  direction: SlidingDirection;
}

// Optional configurations
export interface OptionalConfig {
  glass_height: 'standard' | 'custom';
  custom_height_in: number;
  towel_bar: {
    enabled: boolean;
    style: string | null;
  };
}

// Complete visualization configuration payload
export interface Payload {
  mode: DesignMode;
  image_ref: string;
  enclosure_type: EnclosureType;
  shower_shape: ShowerShape;
  glass_style: GlassStyle;
  hardware_finish: HardwareFinish;
  handle_style: HandleStyle;
  door_opening: DoorOpening;
  hinged_config?: HingedConfig;
  pivot_config?: PivotConfig;
  sliding_config?: SlidingConfig;
  track_preference: TrackPreference;
  optional: OptionalConfig;
  user_notes: string;
  session_id: string;
  catalog_version: string;
  detected_hardware: string;
}

// Alternative config type for components
export interface Configs {
  enclosureType?: EnclosureType;
  glassStyle?: GlassStyle;
  hardwareFinish?: HardwareFinish;
  shape?: ShowerShape;
}

// History item for saved designs
export interface HistoryItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  label: string;
  payload: Payload;
}

// Saved design (for persistence)
export interface SavedDesign {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  thumbnail: string;
  config: Payload;
}
