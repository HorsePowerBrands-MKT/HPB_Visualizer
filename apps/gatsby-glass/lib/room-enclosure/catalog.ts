/**
 * Gatsby Glass Room Enclosure Module catalog
 *
 * `name`, `description` and `details` are consumer-facing copy shown in the
 * wizard. `promptDescriptor` is backend-facing and is only surfaced through
 * `buildRoomEnclosurePromptInput` for prompt assembly.
 *
 * Source: gatsbyglass.com "Glass Wine Rooms & Enclosures" (frameless
 * elegance, classic framed designs, under-stair wine displays; also cigar
 * rooms and home offices) plus the shared hardware finishes.
 */

import type {
  RoomEnclosureApplication,
  RoomEnclosureStyle,
  RoomEnclosureFinish,
} from './types';
import { metalFinishes, metalFinishSwatches, METAL_FINISH_ORDER } from '../metal-finishes';

export interface RoomEnclosureCatalogEntry {
  name: string;
  /** One-line copy under the option label. */
  description: string;
  /** Longer plain-English copy for the info modal. No technical specs. */
  details: string;
  /** Backend-facing. Never rendered to the consumer. */
  promptDescriptor: string;
  /** Example photo for the info modal (served from public/). */
  image?: string;
}

export const ROOM_ENCLOSURE_CATALOG_VERSION = '2026.11';

export const roomEnclosureApplications: Record<RoomEnclosureApplication, RoomEnclosureCatalogEntry> =
  {
    wine_room: {
      name: 'Wine Room',
      description: 'Wine cellar, wine wall, or tasting room',
      details:
        'Glass walls and a glass door turn your wine collection into a display you can see from the rest of the home, while keeping the room sealed for temperature and humidity control.',
      promptDescriptor:
        'a wine room / wine cellar: the glass enclosure closes off the wine storage area so the racks and bottles stay fully visible through clear glass',
    },
    under_stair: {
      name: 'Under-Stair Nook',
      description: 'The space beneath a staircase',
      details:
        'Turn the unused space under your stairs into a glass-enclosed wine display or showcase. The glass follows the slope of the stairs for a built-in look.',
      promptDescriptor:
        'the open cavity beneath a staircase: the glass enclosure closes the open side(s) of the under-stair space, with the top edge of the glass raked to follow the underside of the stair',
    },
    home_office: {
      name: 'Home Office',
      description: 'Office, study, or den',
      details:
        'A glass wall and door give you a quiet, separate workspace without losing natural light or the open feel of your home.',
      promptDescriptor:
        'a home office / study: the glass enclosure partitions the workspace from the adjoining room with a full-height glass wall and a glass door',
    },
    other_room: {
      name: 'Other Room',
      description: 'Cigar lounge, gym, pantry, or display',
      details:
        'Any interior space you want to close off with glass — a cigar lounge, home gym, walk-in pantry, closet, or display room — while keeping it bright and visible.',
      promptDescriptor:
        'an interior room or alcove (lounge, gym, pantry, closet, display space): the glass enclosure closes the open side of the space with a full-height glass wall and a glass door',
    },
  };

export const roomEnclosureStyles: Record<RoomEnclosureStyle, RoomEnclosureCatalogEntry> = {
  frameless: {
    name: 'Frameless',
    description: 'Uninterrupted glass with minimal hardware',
    details:
      'Full-height clear glass panels with no frame around them, held by slim channels and small clamps so the glass itself is the focal point. The cleanest, most modern look that keeps the view completely open.',
    promptDescriptor:
      'a FRAMELESS glass enclosure: full-height clear tempered-look glass panels with polished exposed edges and NO frame around the glass; the panels are held only by a slim low-profile U-channel (about 1 inch) at the floor and ceiling in the selected finish, with glass-to-glass joints at corners and between panels (no vertical posts or mullions); the glass door is a frameless panel on compact pivot or wall-mount hinges with a tall pull handle in the selected finish',
  },
  framed: {
    name: 'Framed',
    description: 'A slim metal frame around every panel',
    details:
      'Glass panels set in a slim, crisp metal frame in your chosen finish, with a matching framed glass door. A classic, structured look that pairs well with traditional and transitional interiors.',
    promptDescriptor:
      'a FRAMED glass enclosure: full-height clear glass panels set in a slim, crisp metal frame in the selected finish — a continuous perimeter frame along the floor, head and side jambs, thin vertical mullions (about 1 to 1.5 inches wide) between panels, and a matching framed glass door with a lever or pull handle in the selected finish; the frame profiles are slim and modern (never a chunky storefront, wood frame or decorative grid)',
  },
};

/**
 * Finishes are shared with the Glass Railing module so both product lines
 * offer the same hardware colors (see `lib/metal-finishes.ts`).
 */
export const roomEnclosureFinishes: Record<RoomEnclosureFinish, RoomEnclosureCatalogEntry> =
  metalFinishes;

/** CSS backgrounds for finish swatches. */
export const roomEnclosureFinishSwatches: Record<RoomEnclosureFinish, string> = metalFinishSwatches;

/** Ordered option lists (object key order is stable but explicit is clearer). */
export const ROOM_ENCLOSURE_APPLICATION_ORDER: RoomEnclosureApplication[] = [
  'wine_room',
  'under_stair',
  'home_office',
  'other_room',
];
export const ROOM_ENCLOSURE_STYLE_ORDER: RoomEnclosureStyle[] = ['frameless', 'framed'];
export const ROOM_ENCLOSURE_FINISH_ORDER: RoomEnclosureFinish[] = [...METAL_FINISH_ORDER];

export const ROOM_ENCLOSURE_CATALOG = {
  applications: roomEnclosureApplications,
  styles: roomEnclosureStyles,
  finishes: roomEnclosureFinishes,
};

/**
 * Human-readable one-liner for a set of room enclosure selections, e.g.
 * "Wine Room • Frameless • Matte Black". Used for history labels,
 * past-visualization cards, and lead emails.
 */
export const formatRoomEnclosureSummary = (config: {
  mode?: string | null;
  application?: string | null;
  style?: string | null;
  finish?: string | null;
}): string => {
  const parts: string[] = [];
  const app = config.application
    ? roomEnclosureApplications[config.application as RoomEnclosureApplication]?.name
    : null;
  const style = config.style
    ? roomEnclosureStyles[config.style as RoomEnclosureStyle]?.name
    : null;
  const fin = config.finish
    ? roomEnclosureFinishes[config.finish as RoomEnclosureFinish]?.name
    : null;
  if (app) parts.push(app);
  if (style) parts.push(style);
  if (fin) parts.push(fin);
  if (config.mode === 'inspiration') parts.push('Inspiration');
  return parts.length > 0 ? parts.join(' • ') : 'Glass Room Enclosure';
};
