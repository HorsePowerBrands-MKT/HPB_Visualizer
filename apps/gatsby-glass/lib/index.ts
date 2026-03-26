/**
 * Gatsby Glass Library
 * 
 * This module exports Gatsby Glass's product catalog and business logic.
 * This is brand-specific code.
 */

// Product catalog (what products Gatsby Glass sells)
export {
  glassStyles,
  hardwareFinishes,
  enclosureTypes,
  handleStyles,
  trackPreferences,
  CATALOG,
} from './gatsby-constants/src/catalog';

// Gatsby Glass brand-specific types (canonical source)
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
} from './gatsby-types';
