import type { DesignMode, EnclosureType, HandleStyle, HardwareFinish, ShowerShape, TrackPreference } from '@repo/types';
import { CATALOG } from './gatsby-constants/src/catalog';

/** Selections posted with shower leads (POP, SAS, RAQ). */
export type ShowerLeadSelection = {
  mode?: DesignMode;
  enclosure_type?: EnclosureType;
  track_preference?: TrackPreference;
  hardware_finish?: HardwareFinish;
  handle_style?: HandleStyle;
  shower_shape?: ShowerShape;
};

/**
 * Human-readable one-liner for shower / room-enclosure selections (lead emails,
 * admin, CRM context). Mirrors `formatRailingSummary` for the shower product line.
 */
export function formatShowerSummary(config: ShowerLeadSelection): string {
  if (config.mode === 'inspiration') {
    return 'Inspiration';
  }

  const parts: string[] = [];
  const enclosure = config.enclosure_type
    ? CATALOG.enclosureTypes[config.enclosure_type]?.name
    : null;
  const framing = config.track_preference
    ? CATALOG.trackPreferences[config.track_preference]?.name
    : null;
  const hardware = config.hardware_finish
    ? CATALOG.hardwareFinishes[config.hardware_finish]?.name
    : null;
  const handle = config.handle_style ? CATALOG.handleStyles[config.handle_style]?.name : null;

  if (enclosure) parts.push(enclosure);
  if (framing) parts.push(`${framing} framing`);
  if (hardware) parts.push(`${hardware} hardware`);
  if (handle) parts.push(`${handle} handle`);

  return parts.length > 0 ? parts.join(' • ') : 'Shower Enclosure';
}