/**
 * Gatsby Glass Library
 * 
 * This module exports Gatsby Glass's product catalog and business logic.
 * This is brand-specific code.
 * 
 * NOTE: Types are currently in @repo/types for convenience but are Gatsby Glass specific.
 * When adding new brands, these types should be moved here.
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

// Re-export Gatsby Glass specific types from @repo/types
// TODO: Move these to gatsby-glass when adding additional brands
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
} from '@repo/types';
