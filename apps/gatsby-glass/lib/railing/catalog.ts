/**
 * Gatsby Glass Railing Module catalog
 *
 * `name`, `description` and `details` are consumer-facing copy shown in the
 * wizard. `promptDescriptor` is backend-facing and is only surfaced through
 * `buildRailingPromptInput` for prompt assembly. Source of truth for the
 * backend wording: docs/railing-product-detials (Backend Coding B01–B30).
 */

import type {
  RailingApplication,
  RailingSetting,
  RailingSystem,
  RailingHandrail,
  RailingFinish,
} from './types';

export interface RailingCatalogEntry {
  name: string;
  /** One-line copy under the option label. */
  description: string;
  /** Longer plain-English copy for the info modal. No technical specs. */
  details: string;
  /** Backend-facing. Never rendered to the consumer. */
  promptDescriptor: string;
}

export interface RailingApplicationEntry extends RailingCatalogEntry {
  setting: RailingSetting;
}

export const RAILING_CATALOG_VERSION = '2025.10';

export const railingApplications: Record<RailingApplication, RailingApplicationEntry> = {
  interior_staircase: {
    name: 'Interior Staircase',
    description: 'Glass along an indoor stair run',
    details:
      'Glass panels follow the slope of your stairs, replacing a wood or metal railing or an existing half wall with an open, light-filled look.',
    setting: 'interior',
    promptDescriptor:
      'an interior staircase; the glass railing follows the existing stair slope and any adjoining landing',
  },
  interior_balcony: {
    name: 'Interior Balcony',
    description: 'Overlook, loft, or mezzanine edge',
    details:
      'Level glass panels along a loft, landing, or balcony edge so the space below stays visible and the room feels larger.',
    setting: 'interior',
    promptDescriptor:
      'an interior balcony, loft, landing, or overlook edge; the glass railing runs level along the existing edge',
  },
  exterior_deck: {
    name: 'Exterior Deck',
    description: 'Deck, patio, porch, or rooftop',
    details:
      'Weather-ready glass along a deck, patio, or porch perimeter that keeps your view wide open while replacing bulky railings.',
    setting: 'exterior',
    promptDescriptor:
      'an exterior deck, patio, porch, or rooftop perimeter; the glass railing follows the existing deck edge and railing line',
  },
  pool_balustrade: {
    name: 'Pool Fence',
    description: 'Pool balustrade or pool fence',
    details:
      'A clear glass barrier around the pool area that keeps the water in full view. Includes a gate so the area stays easy to access.',
    setting: 'exterior',
    promptDescriptor:
      'an outdoor pool area; the glass pool balustrade / pool fence encloses the usable pool deck and includes one operable gate',
  },
};

export const railingSystems: Record<RailingSystem, RailingCatalogEntry> = {
  base_shoe: {
    name: 'Base Shoe',
    description: 'Continuous channel along the floor',
    details:
      'A slim channel runs along the floor edge and holds the bottom of each glass panel, so the glass rises straight from the floor with no posts. The cleanest, most seamless look.',
    promptDescriptor:
      'clear frameless glass seated continuously in a slim base shoe: one straight rectangular aluminum channel about 2 to 2.5 inches tall and about 2.5 inches wide (barely wider than the glass), sitting directly on the finished floor along the railing line, so it reads as a thin dark band at the floor — like a baseboard, less than one-fifteenth of the glass height — never a curb, step, ledge, planter, box or plinth; the bottom edge of every fixed glass panel enters a narrow slot in the top of the shoe; no individual spigots, floor-mounted posts, clamps or vertical framing',
  },
  spigot: {
    name: 'Spigot',
    description: 'Individual clamps at the base of each panel',
    details:
      'Small individual clamps anchor each panel to the floor, leaving open space beneath the glass. A lighter, more open look that works well on decks and around pools.',
    promptDescriptor:
      'clear frameless glass supported by individual compact floor-mounted spigots: small clamps about 5 inches tall and about 2 inches wide (no taller than a coffee mug) bolted to the floor and gripping the bottom edge of the glass, two per panel set in from each panel edge, with the glass bottom edge floating about 3 to 4 inches above the floor and open space beneath; no continuous bottom channel or base shoe, no posts, no vertical framing',
  },
};

export const railingHandrailOptions: Record<RailingHandrail, RailingCatalogEntry> = {
  top_mount: {
    name: 'Top-Mounted Handrail',
    description: 'Rail caps the top edge of the glass',
    details:
      'A continuous rail sits directly on the top edge of the glass, capping it from end to end. Gives a clean, finished top line and a comfortable grip.',
    promptDescriptor:
      'a continuous top-mounted cap rail: a thin, square-profile channel (about finger-thick, low-profile) seated directly on the top edge of the glass and running its full length, mitered at corners, following the railing geometry; it is NOT a round tube grab bar, there is NO separate rail on the face of the glass and NO rail standing off the glass on brackets',
  },
  side_mount: {
    name: 'Side-Mounted Handrail',
    description: 'Rail mounted along the face of the glass',
    details:
      'A continuous rail is mounted on the inside face of the glass on small standoff brackets, just below the top edge. The glass edge stays exposed above it.',
    promptDescriptor:
      'a continuous side-mounted handrail: a slim rectangular or round bar held a couple of inches off the inside face of the glass on small standoff pins, mounted a few inches below the top edge at hand height, running the full length and following the railing geometry; the polished top edge of the glass remains exposed above the rail — there is NO cap rail on top of the glass',
  },
  no_handrail: {
    name: 'No Handrail',
    description: 'Clean, open glass edge',
    details:
      'The polished top edge of the glass is left clean and uninterrupted for the most minimal look.',
    promptDescriptor:
      'no handrail, cap rail or top rail; the top edge of the glass stays visually clean except where gate hardware or another required connection is present',
  },
};

export const railingFinishes: Record<RailingFinish, RailingCatalogEntry> = {
  matte_black: {
    name: 'Matte Black',
    description: 'Modern flat black',
    details:
      'A bold, contemporary flat black finish that frames the glass with crisp contrast and hides fingerprints well.',
    promptDescriptor: 'matte black',
  },
  brushed_stainless: {
    name: 'Brushed Stainless',
    description: 'Soft satin stainless steel',
    details:
      'A soft satin stainless steel finish with subtle brush marks. Understated, durable, and at home indoors or out.',
    promptDescriptor: 'brushed (satin) stainless steel',
  },
  polished_stainless: {
    name: 'Polished Stainless',
    description: 'Bright mirror stainless steel',
    details:
      'A bright, mirror-like stainless steel finish that catches the light and reads as crisp and high-end.',
    promptDescriptor: 'polished (mirror) stainless steel',
  },
};

/** CSS backgrounds for finish swatches (same style as the shower hardware swatches). */
export const railingFinishSwatches: Record<RailingFinish, string> = {
  matte_black: '#171717',
  brushed_stainless:
    'repeating-linear-gradient(45deg, #d0d0d0, #d0d0d0 2px, #c0c0c0 2px, #c0c0c0 4px)',
  polished_stainless: 'linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #a0a0a0 100%)',
};

/** Ordered option lists (object key order is stable but explicit is clearer). */
export const RAILING_APPLICATION_ORDER: RailingApplication[] = [
  'interior_staircase',
  'interior_balcony',
  'exterior_deck',
  'pool_balustrade',
];
export const RAILING_SYSTEM_ORDER: RailingSystem[] = ['base_shoe', 'spigot'];
export const RAILING_HANDRAIL_ORDER: RailingHandrail[] = ['top_mount', 'side_mount', 'no_handrail'];
export const RAILING_FINISH_ORDER: RailingFinish[] = [
  'matte_black',
  'brushed_stainless',
  'polished_stainless',
];

export const RAILING_CATALOG = {
  applications: railingApplications,
  systems: railingSystems,
  handrails: railingHandrailOptions,
  finishes: railingFinishes,
};

/**
 * Human-readable one-liner for a set of railing selections, e.g.
 * "Exterior Deck · Base Shoe · Handrail · Matte Black". Used for history
 * labels, past-visualization cards, and lead emails.
 */
export const formatRailingSummary = (config: {
  mode?: string | null;
  application?: string | null;
  railing_system?: string | null;
  handrail?: string | null;
  finish?: string | null;
}): string => {
  const parts: string[] = [];
  const app = config.application
    ? railingApplications[config.application as RailingApplication]?.name
    : null;
  const sys = config.railing_system
    ? railingSystems[config.railing_system as RailingSystem]?.name
    : null;
  const rail = config.handrail
    ? railingHandrailOptions[config.handrail as RailingHandrail]?.name
    : null;
  const fin = config.finish ? railingFinishes[config.finish as RailingFinish]?.name : null;
  if (app) parts.push(app);
  if (sys) parts.push(sys);
  if (rail) parts.push(rail);
  if (fin) parts.push(fin);
  if (config.mode === 'inspiration') parts.push('Inspiration');
  return parts.length > 0 ? parts.join(' • ') : 'Glass Railing';
};
