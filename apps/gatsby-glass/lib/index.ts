/**
 * Gatsby Glass Library
 * 
 * This module exports Gatsby Glass's product catalog, types, and business logic.
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

// Product types (TypeScript types for Gatsby Glass products)
export type {
  DesignMode,
  EnclosureType,
  ShowerShape,
  GlassStyle,
  HardwareFinish,
  HandleStyle,
  TrackPreference,
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
