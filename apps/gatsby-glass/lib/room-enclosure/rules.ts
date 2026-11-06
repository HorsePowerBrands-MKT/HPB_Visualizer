/**
 * Gatsby Glass Room Enclosure Module — compatibility and guardrail rules
 *
 * Single source of truth for what the room enclosure visualizer may render.
 * Both consumer paths (Design Your Own and Match Inspiration) go through
 * these rules: the prompt template renders its style / door / finish /
 * placement / unsupported-type sections from the constants below, and
 * `validateRoomEnclosureSelections` blocks any selection that is not an
 * approved family before a prompt is assembled.
 *
 * Source: gatsbyglass.com "Glass Wine Rooms & Enclosures" (frameless
 * elegance, classic framed designs, under-stair wine displays), the shared
 * hardware finishes, and the proportions of real frameless / framed glass
 * partition installs.
 *
 * Pure data + pure functions. No React, no I/O.
 */

import type {
  RoomEnclosureStyle,
  RoomEnclosureFinish,
  RoomEnclosureApplication,
  RoomEnclosurePayload,
  RoomEnclosureMode,
} from './types';
import { APPROVED_METAL_FINISHES, METAL_FINISH_INSPIRATION_MAPPING } from '../metal-finishes';

// ---------------------------------------------------------------------------
// Approved families
// ---------------------------------------------------------------------------

export const APPROVED_ROOM_ENCLOSURE_STYLES: readonly RoomEnclosureStyle[] = ['framed', 'frameless'];
export const APPROVED_ROOM_ENCLOSURE_APPLICATIONS: readonly RoomEnclosureApplication[] = [
  'wine_room',
  'under_stair',
  'home_office',
  'other_room',
];
/** Shared with the Glass Railing module (see `lib/metal-finishes.ts`). */
export const APPROVED_ROOM_ENCLOSURE_FINISHES: readonly RoomEnclosureFinish[] = APPROVED_METAL_FINISHES;

// ---------------------------------------------------------------------------
// Unsupported enclosure types (never rendered, on either path)
// ---------------------------------------------------------------------------

export interface UnsupportedEnclosureType {
  id: string;
  /** Prompt-facing description of what must never appear. */
  label: string;
  /** Inspiration path: the approved style an inspiration photo of this type maps to. */
  mapsTo: RoomEnclosureStyle;
}

export const UNSUPPORTED_ENCLOSURE_TYPES: readonly UnsupportedEnclosureType[] = [
  {
    id: 'divided_lite',
    label: 'divided-lite or grid-style glass: French doors, muntin grids, steel-and-glass "factory window" grids of many small panes',
    mapsTo: 'framed',
  },
  {
    id: 'storefront',
    label: 'heavy commercial storefront or curtain-wall framing with thick mullions',
    mapsTo: 'framed',
  },
  { id: 'wood_frame', label: 'wood, painted or vinyl frames and doors', mapsTo: 'framed' },
  {
    id: 'barn_door',
    label: 'barn-door or exposed sliding-track hardware, bypass sliders, folding or accordion doors',
    mapsTo: 'frameless',
  },
  {
    id: 'obscure_glass',
    label: 'tinted, smoked, mirrored, frosted, reeded, fluted or patterned glass',
    mapsTo: 'frameless',
  },
  { id: 'partial_height', label: 'half-height, pony-wall or counter-height glass partitions', mapsTo: 'frameless' },
  { id: 'mixed_style', label: 'mixing framed and frameless panels in the same enclosure', mapsTo: 'frameless' },
];

// ---------------------------------------------------------------------------
// Prompt rule text (consumed by prompts/room-enclosure-templates.ts)
// ---------------------------------------------------------------------------

export interface StyleRuleSet {
  /** Positive behavior. */
  must: readonly string[];
  /** Hard negatives — anything here in a render is a failure. */
  forbidden: readonly string[];
  /** Observed proportions from real installs. */
  proportions: readonly string[];
  /** How the operable door is built for this style. */
  door: readonly string[];
}

export const STYLE_RULES: Record<RoomEnclosureStyle, StyleRuleSet> = {
  frameless: {
    must: [
      '- Every fixed glass panel is a full-height frameless sheet of clear glass with polished edges, held ONLY by a slim low-profile channel at the floor and at the ceiling (or at the underside of the stair), and by the channel or compact clamps where it meets a wall.',
      '- Panels meet each other with a clean glass-to-glass joint (a hairline seam), including at corners. The enclosure reads as one continuous sheet of glass.',
    ],
    forbidden: [
      '- HARD LOCK: if ANY vertical post, mullion, frame profile around a glass edge, perimeter frame or divided-lite grid appears, the render FAILS.',
    ],
    proportions: [
      '- MOUNTING PROPORTIONS (critical — the most common error is hardware that is far too heavy):',
      '  • CHANNEL: a slim U-channel about 1 inch tall and barely wider than the glass, in the selected finish, running continuously along the floor line and the ceiling line of the enclosure. It is a thin band, never a curb, step or box. If the channel looks taller than two fingers, it is WRONG — make it thinner.',
      '  • JOINTS: vertical glass-to-glass seams are hairline; no cover strips, no clips on the glass face except small compact clamps where a panel meets a wall.',
      '  • PANELS: wide sheets (about 3 to 5 feet each) with as few vertical joints as the opening allows; uniform height.',
      '  • The glass dominates the view; hardware reads as fine detail at the floor and ceiling.',
    ],
    door: [
      '- DOOR (frameless): a full-height frameless glass door panel in the same clear glass, hung on compact hardware in the selected finish — either top-and-bottom pivot hinges / patch fittings or two wall-mount hinges — with a tall vertical pull handle (ladder or bar pull, about 12 to 24 inches) in the selected finish. No frame around the door, no closer box, no barn-door track.',
    ],
  },
  framed: {
    must: [
      '- Every fixed glass panel sits inside a slim metal frame in the selected finish: one continuous perimeter frame along the floor, the head (ceiling or stair underside) and both side jambs, with thin vertical mullions where panels meet.',
      '- The door has its own matching slim frame and reads as part of the same system; the whole enclosure uses ONE consistent frame profile.',
    ],
    forbidden: [
      '- HARD LOCK: if a glass edge is left without its frame, or the frame reads as heavy commercial storefront, wood, a painted frame or a divided-lite grid of small panes, the render FAILS.',
    ],
    proportions: [
      '- FRAME PROPORTIONS (critical — the most common error is a frame that is far too heavy or turns into a window grid):',
      '  • PROFILES: slim, flat, crisp rectangular metal profiles about 1 to 1.5 inches wide, uniform everywhere (perimeter and mullions). Never more than 2 inches. If a profile looks wider than two fingers, it is WRONG — make it slimmer.',
      '  • MULLIONS: ONLY at panel joints — typically one vertical mullion every 3 to 5 feet. Never a grid of small panes, never horizontal rails across the glass (except the door frame top and bottom).',
      '  • PANELS: wide, full-height clear glass between mullions; the glass still dominates the view and the frame reads as thin lines.',
    ],
    door: [
      '- DOOR (framed): a full-height glass door in a matching slim metal frame, hung on hinges in the selected finish, with a lever or vertical pull handle in the selected finish. The door frame is the same slim profile as the walls. No barn-door track, no wood door, no divided-lite grid.',
    ],
  },
};

/** The operable door every enclosure needs, independent of style. */
export const DOOR_RULES: readonly string[] = [
  '- Include EXACTLY ONE operable glass door (a pair of doors only when the opening is wider than about 8 feet), placed at the most logical pedestrian approach into the enclosed space and aligned with the existing circulation path. The door must read visually as operable (hinges and handle visible) and distinct from the fixed panels.',
  '- The door is a swinging door: hinged or pivot. Never a sliding, bypass, barn, pocket, folding or accordion door.',
  '- The door is about 30 to 36 inches wide and full height, in the same glass and the same style and finish as the fixed panels.',
];

/** The glass itself, on either path. */
export const GLASS_RULES: readonly string[] = [
  '- GLASS: clear, low-iron look (only a faint green edge), completely transparent so everything inside the enclosure stays visible. No tint, smoke, frost, reeding, pattern or mirror. Subtle realistic reflections and edge highlights only.',
  '- HEIGHT: full height — from the floor to the ceiling (or to the underside of the stair / soffit) with no gap at the top and no gap at the floor. Never a half-height or counter-height partition.',
  '- COVERAGE: the enclosure closes the ENTIRE open side(s) of the space being enclosed — the full width of the opening, tight to the walls on both ends. No gap between the glass and the wall, floor or ceiling.',
];

/** The selected finish is applied to every piece of visible hardware. */
export const FINISH_RULES: readonly string[] = [
  '- Apply the selected finish consistently to ALL visible enclosure hardware: the frame and mullions (framed) or the channels and clamps (frameless), the door hinges or pivots, and the door handle. ONE finish only — never mixed metals.',
  '- An explicit finish selection overrides any finish shown in an inspiration image.',
];

/**
 * Only the enclosure changes. The space inside and around it (racks,
 * bottles, furniture, flooring, stairs, lighting) is the customer's and
 * stays exactly as photographed.
 */
export const PRESERVATION_RULES: readonly string[] = [
  '- Preserve the flooring, walls, ceiling, trim, stairs, windows, doors elsewhere, lighting, furniture, wine racks, bottles, shelving, cabinetry, decor and ALL surrounding elements exactly as shown. Do not add people.',
  '- Do not add, remove, move or restyle wine racks, bottles, shelving, furniture or lighting to "furnish" the enclosure. The glass closes off the space as it is in input_1.',
  '- Do not move, remove, add, recolor or redesign unrelated objects or surfaces. Do not alter camera viewpoint, crop, architecture, flooring or lighting to accommodate the enclosure.',
];

/**
 * Only the target opening gets glass. Other glass in the photo (windows,
 * other glass doors, mirrors, a shower) is never restyled.
 */
export const BACKGROUND_GLASS_PRESERVATION_RULES: readonly string[] = [
  '- TARGET OPENING ONLY: the target is the ONE opening (or the one existing partition / door) that closes off the space being enclosed — every panel and the door of that single enclosure. Install glass on ALL of the target opening and nowhere else.',
  '- Every OTHER window, glass door, mirror, shower enclosure, railing or piece of metalwork in input_1 — in the background, through a doorway, in a reflection — is NOT the target. Keep each one exactly as in input_1: same material, color, finish, style and position. Never recolor it to the selected finish, never reframe it, never remove or extend it.',
];

/** Existing-condition rules (automatic from the photo). */
export const EXISTING_CONDITION_RULES: Record<'open_opening' | 'existing_partition' | 'existing_glass' | 'none', readonly string[]> = {
  open_opening: [
    '- The space is OPEN (no wall, door or glass closes it). ADD the enclosure across the existing opening: use the opening\'s own edges — the floor line, the walls or columns at each side, and the ceiling, header or stair underside above — as the placement anchor. Do not reshape, relocate, widen or narrow the opening.',
  ],
  existing_partition: [
    '- A solid wall, door, partition or screen currently closes the space. REMOVE only that partition / door at the enclosure location and replace it with the glass enclosure along the SAME line, filling the same opening from floor to ceiling. Preserve the surrounding full-height walls, trim, header, flooring and ceiling. Do not remove unrelated drywall.',
  ],
  existing_glass: [
    '- An existing glass enclosure or glass door is present at the location. Replace it with the selected style and finish along the SAME line and opening. Preserve everything around it.',
  ],
  none: [
    '- The existing condition could not be determined. Identify the single most logical opening into the space being enclosed (the open side facing the camera, or the doorway into it) and treat it as an open opening: add the enclosure across that opening without altering the architecture.',
  ],
};

/** Application placement rules. */
export const APPLICATION_RULES: Record<RoomEnclosureApplication, readonly string[]> = {
  wine_room: [
    '- WINE ROOM: the glass closes the threshold / open side of the wine storage area so the racks, bottles and lighting stay FULLY visible through clear glass. Never run glass through or in front of individual racks; the racks stay behind the glass exactly where they are.',
    '- If no racks are visible in input_1, do NOT add any. Enclose the space as photographed.',
  ],
  under_stair: [
    '- UNDER-STAIR: the enclosure closes the open side of the cavity beneath the staircase. The top edge of the glass is RAKED to follow the underside of the stair (parallel to the stringer / soffit), the bottom edge sits on the floor, and the end of the run lands against the wall or the newel. The tallest part of the opening holds the door.',
    '- Preserve the staircase exactly: same treads, risers, stringers, handrail, balusters and position. Never move, rebuild or reshape the stair, and never put glass on the stair treads or across the stair itself.',
  ],
  home_office: [
    '- HOME OFFICE: a full-height glass wall across the open side of the workspace, with the door at the natural entry point. The desk, chair, shelving and equipment stay inside, exactly as photographed, and remain visible through the glass.',
  ],
  other_room: [
    '- ROOM / ALCOVE: a full-height glass wall across the open side (or the doorway) of the space, with one door at the natural entry point. Everything inside the space stays exactly as photographed and remains visible through the glass.',
  ],
};

/** Match Inspiration: the inspiration style applies to the target enclosure only. */
export const INSPIRATION_TARGET_ONLY_RULES: readonly string[] = [
  '- The style, hardware and finish from input_2 apply ONLY to the new target enclosure. Do not apply them to any other window, door, glass or metalwork in input_1.',
];

/**
 * Match Inspiration with no explicit style selection. Maps what input_2
 * shows onto one approved style.
 */
export const INSPIRATION_STYLE_MAPPING: readonly string[] = [
  '- Read the enclosure in input_2 and map it to exactly ONE approved style:',
  '  • metal frame profiles visible around the glass edges, with mullions between panels and a framed door → FRAMED (slim profiles, no grid)',
  '  • bare polished glass edges with only a floor / ceiling channel, clamps and compact hinges → FRAMELESS',
  '  • a divided-lite, grid, steel-window, French-door or storefront look → FRAMED with slim profiles and NO grid of small panes',
  '- Use exactly one style consistently for every panel and the door. Do not mix framed and frameless in the same enclosure.',
];

/** Match Inspiration with no explicit finish selection (shared mapping). */
export const INSPIRATION_FINISH_MAPPING: readonly string[] = METAL_FINISH_INSPIRATION_MAPPING;

/** Inspiration rules plus the unsupported-type mapping for the Match Inspiration path. */
export const INSPIRATION_RULES: readonly string[] = [
  '- input_2 controls STYLE only: framed vs. frameless appearance, hardware style, door and handle style, and finish.',
  '- input_1 controls SPACE and GEOMETRY. Do NOT copy the room, the opening size, the racks, the furniture, the background or the architecture from input_2. Determine enclosure placement from input_1 and the placement rules above.',
  ...INSPIRATION_TARGET_ONLY_RULES,
  '- Precedence: explicit consumer selection > inspiration image > backend defaults. Any selection listed in the ENCLOSURE_SPECIFICATION overrides what input_2 shows.',
  '- Map whatever input_2 shows onto exactly ONE approved Gatsby Glass style (FRAMED with slim profiles, or FRAMELESS) with a swinging glass door. Never copy an unsupported enclosure type from input_2:',
  ...UNSUPPORTED_ENCLOSURE_TYPES.map(
    (t) => `  • ${t.label} → render as ${t.mapsTo === 'framed' ? 'slim-framed clear glass' : 'frameless clear glass'} instead`
  ),
];

/** Approved vocabulary + the explicit never-render list. */
export const UNSUPPORTED_TYPE_RULES: readonly string[] = [
  'NOT APPROVED (never render these, on either path, even if they appear in an inspiration photo):',
  ...UNSUPPORTED_ENCLOSURE_TYPES.map((t) => `- ${t.label}`),
  '- Restrict visuals to Gatsby Glass approved enclosure families: Framed (slim metal profiles) or Frameless, full height, clear glass, with a swinging glass door and the selected finish.',
];

// ---------------------------------------------------------------------------
// Validation (blocks unsupported selections before prompt assembly)
// ---------------------------------------------------------------------------

export interface RoomEnclosureRuleIssue {
  field: 'mode' | 'application' | 'style' | 'finish';
  message: string;
}

const isOneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value);

/**
 * Checks a payload against the approved families. Returns an empty array
 * when the payload may be rendered.
 *
 * Design Your Own requires every selection. Match Inspiration lets style /
 * finish be null (taken from the inspiration photo), but anything that IS
 * set must still be an approved value.
 */
export function validateRoomEnclosureSelections(payload: RoomEnclosurePayload): RoomEnclosureRuleIssue[] {
  const issues: RoomEnclosureRuleIssue[] = [];
  const mode: RoomEnclosureMode = payload.mode;

  if (mode !== 'configure' && mode !== 'inspiration') {
    issues.push({ field: 'mode', message: `Unknown mode "${String(mode)}"` });
  }

  if (!isOneOf(payload.application, APPROVED_ROOM_ENCLOSURE_APPLICATIONS)) {
    issues.push({ field: 'application', message: `Unsupported room type "${String(payload.application)}"` });
  }

  const requireAll = mode === 'configure';

  if (payload.style === null) {
    if (requireAll) issues.push({ field: 'style', message: 'Enclosure style is required' });
  } else if (!isOneOf(payload.style, APPROVED_ROOM_ENCLOSURE_STYLES)) {
    issues.push({ field: 'style', message: `Unsupported enclosure style "${String(payload.style)}"` });
  }

  if (payload.finish === null) {
    if (requireAll) issues.push({ field: 'finish', message: 'Finish is required' });
  } else if (!isOneOf(payload.finish, APPROVED_ROOM_ENCLOSURE_FINISHES)) {
    issues.push({ field: 'finish', message: `Unsupported finish "${String(payload.finish)}"` });
  }

  return issues;
}

/** Thrown by prompt assembly when a payload fails the rules. */
export class RoomEnclosureRuleViolationError extends Error {
  readonly issues: RoomEnclosureRuleIssue[];
  constructor(issues: RoomEnclosureRuleIssue[]) {
    super(`Room enclosure selections violate the approved rules: ${issues.map((i) => i.message).join('; ')}`);
    this.name = 'RoomEnclosureRuleViolationError';
    this.issues = issues;
  }
}

export function assertRoomEnclosureSelectionsRenderable(payload: RoomEnclosurePayload): void {
  const issues = validateRoomEnclosureSelections(payload);
  if (issues.length > 0) throw new RoomEnclosureRuleViolationError(issues);
}
