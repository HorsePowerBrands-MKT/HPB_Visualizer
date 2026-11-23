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
  RoomEnclosureExistingCondition,
  RoomEnclosurePayload,
  RoomEnclosureMode,
} from './types';
import { APPROVED_METAL_FINISHES, METAL_FINISH_INSPIRATION_MAPPING } from '../metal-finishes';

// ---------------------------------------------------------------------------
// Approved families
// ---------------------------------------------------------------------------

export const APPROVED_ROOM_ENCLOSURE_STYLES: readonly RoomEnclosureStyle[] = ['framed', 'frameless', 'grid'];
export const APPROVED_ROOM_ENCLOSURE_APPLICATIONS: readonly RoomEnclosureApplication[] = [
  'wine_room',
  'under_stair',
  'home_office',
  'dining_room',
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
    id: 'decorative_grid',
    label: 'decorative or traditional grilles: diamond, arched, curved or colonial muntin patterns, wood or white grilles, or snap-in grids that sit only on one face of the glass',
    mapsTo: 'grid',
  },
  {
    id: 'unselected_grid',
    label: 'a grid of panes on a Framed or Frameless enclosure (a grid appears ONLY when the Grid style is selected or chosen from the inspiration photo)',
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

/** How the inspiration path names each approved style when it maps an unsupported type onto it. */
const STYLE_FALLBACK_LABEL: Record<RoomEnclosureStyle, string> = {
  framed: 'slim-framed clear glass',
  frameless: 'frameless clear glass',
  grid: 'the Grid style (slim frame, regular rectangular panes, same finish)',
};

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
      '- Every fixed glass panel is a full-height frameless sheet of clear glass with bare polished edges, held ONLY by small square clamps (clips) in the selected finish: two or three clamps along the floor edge, two or three along the top edge (ceiling, soffit or stair underside) and two or three along any edge that meets a wall.',
      '- Panels meet each other with a clean glass-to-glass joint (a hairline seam), including at corners. The enclosure reads as clear glass with a few small clamps, not as glass inside an outline.',
      '- TRANSOM: where a fixed glass panel sits above the door (common under a tall or sloped ceiling), it is clamped exactly like the other panels: clamps along its top edge into the ceiling and where it meets the neighboring panels. A transom is never left floating without hardware.',
    ],
    forbidden: [
      '- HARD LOCK: NO channel. If a continuous metal channel, track, shoe, cap or edge strip runs along ANY edge of the glass — floor, ceiling, wall or stair — the render FAILS. A metal line tracing the outline of the enclosure is the framed look, not frameless.',
      '- HARD LOCK: if ANY vertical post, mullion, frame profile around a glass edge, perimeter frame or divided-lite grid appears, the render FAILS.',
    ],
    proportions: [
      '- MOUNTING PROPORTIONS (critical — the most common error is too much hardware):',
      '  • CLAMPS: compact square clamps about 2 inches across, low profile, in the selected finish. Space them along each edge — one near each end (about 6 to 12 inches in from the corner), plus one in the middle of edges longer than about 5 feet. Between the clamps the glass edge is bare and meets the floor, ceiling or wall directly.',
      '  • JOINTS: vertical glass-to-glass seams are hairline; no cover strips, no posts.',
      '  • PANELS: wide sheets (about 3 to 5 feet each) with as few vertical joints as the opening allows; uniform height.',
      '  • The glass dominates the view; the clamps read as small evenly spaced details.',
    ],
    door: [
      '- DOOR (frameless): a frameless glass door panel in the same clear glass with a tall vertical pull handle (ladder or bar pull, about 12 to 24 inches) in the selected finish. It hangs on two compact hinges (glass-to-wall or glass-to-glass) or on a top-and-bottom pivot pair, in the selected finish. No frame around the door, no closer box, no barn-door track.',
    ],
  },
  framed: {
    must: [
      '- Every fixed glass panel sits inside a slim metal frame in the selected finish: one continuous perimeter frame along the floor, the head (ceiling or stair underside) and both side jambs, with thin vertical mullions where panels meet.',
      '- A vertical mullion stands at EVERY joint between two panels and at every corner: glass never meets glass directly.',
      '- The door has its own matching slim frame on all four sides (both stiles, top rail and bottom rail) and reads as part of the same system; the whole enclosure uses ONE consistent frame profile.',
      '- TRANSOM: where a fixed glass panel sits above the door, a horizontal frame member runs across the head of the door and the transom is framed like every other panel.',
    ],
    forbidden: [
      '- HARD LOCK: if a glass edge is left without its frame, or the frame reads as heavy commercial storefront, wood, a painted frame or a divided-lite grid of small panes (that is the separate Grid style), the render FAILS.',
      '- HARD LOCK: if panels meet glass-to-glass with no mullion, if the door has no frame of its own, or if the only metal is an outline around the perimeter, the render reads as frameless and FAILS.',
    ],
    proportions: [
      '- FRAME PROPORTIONS (critical — the most common error is a frame that is far too heavy or turns into a window grid):',
      '  • PROFILES: slim, flat, crisp rectangular metal profiles about 1 to 1.5 inches wide, uniform everywhere (perimeter and mullions). Never more than 2 inches. If a profile looks wider than two fingers, it is WRONG — make it slimmer.',
      '  • MULLIONS: ONLY at panel joints — typically one vertical mullion every 3 to 5 feet. Never a grid of small panes, never horizontal rails across the glass (except the door frame top and bottom).',
      '  • PANELS: wide, full-height clear glass between mullions; the glass still dominates the view and the frame reads as thin lines.',
    ],
    door: [
      '- DOOR (framed): a glass door in a matching slim metal frame, hung on two or three hinges in the selected finish set into its hinge-side stile, with a lever or vertical pull handle in the selected finish on the opposite stile. The door frame is the same slim profile as the walls. No barn-door track, no wood door, no divided-lite grid.',
    ],
  },
  grid: {
    must: [
      '- Every fixed glass panel sits inside a slim metal frame in the selected finish (one continuous perimeter frame along the floor, the head and both side jambs, with a vertical mullion at every panel joint and corner), AND thin flat metal grid bars in the same finish divide each panel into a regular grid of rectangular panes: the steel-window / divided-lite look.',
      '- ONE GRID across the whole enclosure: every panel and the door use the same pattern. The horizontal bars sit at the same heights on every panel and on the door, so each horizontal grid line runs straight and level across the entire enclosure; vertical bars are evenly spaced within each panel.',
      '- The door has its own matching frame on all four sides and carries the same grid as the fixed panels; it reads as part of the same system.',
      '- TRANSOM: where a fixed glass panel sits above the door, a horizontal frame member runs across the head of the door and the transom carries the same grid.',
    ],
    forbidden: [
      '- HARD LOCK: if any panel or the door is missing its grid, if the grid differs from panel to panel, or if the horizontal bars do not line up across the enclosure, the render FAILS.',
      '- HARD LOCK: the grid is straight, flat metal bars forming rectangles only, in the selected finish. Diamond, arched, curved or colonial patterns, wood or white bars, or bars that look stuck onto one face of the glass make the render FAIL.',
      '- HARD LOCK: heavy commercial storefront framing, wood, painted or vinyl frames FAIL. The glass between the bars is clear, never frosted, reeded or tinted.',
    ],
    proportions: [
      '- GRID PROPORTIONS (critical — the most common errors are bars that are too heavy, or so many bars the room disappears):',
      '  • BARS AND FRAME: slim, flat, crisp rectangular metal profiles about 1 to 1.5 inches wide, uniform everywhere (perimeter, mullions and grid bars). Never more than 2 inches.',
      '  • PANES: each pane about 1.5 to 2.5 feet wide and about 2 to 3 feet tall, taller than wide, so a full-height panel has three or four rows of panes and one or two columns. Never a fine mesh of small squares.',
      '  • The room behind stays clearly visible through the panes; the bars read as a crisp graphic pattern, not a wall.',
    ],
    door: [
      '- DOOR (grid): a glass door in a matching slim metal frame carrying the same grid as the fixed panels, hung on two or three hinges in the selected finish set into its hinge-side stile, with a lever or vertical pull handle in the selected finish on the opposite stile. No barn-door track, no wood door, no French-door pair unless the opening is wider than about 8 feet.',
    ],
  },
};

/** The operable door every enclosure needs, independent of style. */
export const DOOR_RULES: readonly string[] = [
  '- Include EXACTLY ONE operable glass door (a pair of doors only when the opening is wider than about 8 feet), placed at the most logical pedestrian approach into the enclosed space and aligned with the existing circulation path. The door must read visually as operable (hinges and handle visible) and distinct from the fixed panels.',
  '- The door is a swinging door: hinged or pivot. Never a sliding, bypass, barn, pocket, folding or accordion door.',
  '- HINGE SIDE vs HANDLE SIDE: ALL hinges (or the pivot pair) sit on ONE vertical edge of the door, the hinge edge. The handle sits on the OPPOSITE vertical edge, the latch edge. Nothing else is on the latch edge: no hinge, clamp, patch fitting or pivot at its top or bottom. Hinges on both sides of the door, or a hinge on the same side as the handle, is a FAILED render.',
  '- DOOR SIZE: a real walk-through door about 36 inches wide (never narrower than about 30 inches), the same width as the doors elsewhere in input_1. It is as tall as the glass beside it (full height), or about 7 to 8 feet tall with a fixed glass transom above it when the ceiling is taller or sloped. Judge its size against the furniture, doorways and people-scale objects in the photo: an adult must obviously fit through it.',
  '- The door is in the same glass and the same style and finish as the fixed panels.',
];

/** The glass itself, on either path. */
export const GLASS_RULES: readonly string[] = [
  '- GLASS: clear, low-iron look (only a faint green edge), completely transparent so everything inside the enclosure stays visible. No tint, smoke, frost, reeding, pattern or mirror. Subtle realistic reflections and edge highlights only.',
  '- HEIGHT: full height — from the floor to the ceiling (or to the underside of the stair / soffit) with no gap at the top and no gap at the floor. Never a half-height or counter-height partition.',
  '- COVERAGE: the enclosure closes the ENTIRE open side(s) of the space being enclosed — the full width of the opening, tight to the walls on both ends. No gap between the glass and the wall, floor or ceiling.',
];

/** The selected finish is applied to every piece of visible hardware. */
export const FINISH_RULES: readonly string[] = [
  '- Apply the selected finish consistently to ALL visible enclosure hardware: the frame and mullions (framed), the frame and grid bars (grid) or the clamps (frameless), the door hinges or pivots, and the door handle. ONE finish only — never mixed metals.',
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
export const EXISTING_CONDITION_RULES: Record<RoomEnclosureExistingCondition, readonly string[]> = {
  open_opening: [
    '- The space is OPEN (no wall, door or glass closes it). ADD the enclosure across the existing opening: use the opening\'s own edges — the floor line, the walls or columns at each side, and the ceiling, header or stair underside above — as the placement anchor. Do not reshape, relocate, widen or narrow the opening.',
  ],
  existing_partition: [
    '- A solid wall, door, partition or screen currently closes the space. REMOVE only that partition / door at the enclosure location and replace it with the glass enclosure along the SAME line, filling the same opening from floor to ceiling. Preserve the surrounding full-height walls, trim, header, flooring and ceiling. Do not remove unrelated drywall.',
  ],
  existing_glass: [
    '- An existing glass enclosure or glass door is present at the location. Replace it with the selected style and finish along the SAME line and opening. Preserve everything around it.',
  ],
  open_floor: [
    '- The area is OPEN FLOOR: no wall, header, doorway or alcove frames the space to enclose. CREATE the room: build NEW full-height glass walls standing on the floor along EVERY segment of the customer placement path (below), rising to the ceiling and held at the floor and ceiling by the selected system. Two or three glass walls plus the existing walls typically form the new room. Where an end of the path meets or nearly meets a wall, column or the stair, the glass closes that gap.',
  ],
  none: [
    '- The existing condition could not be determined. If a customer placement path is provided below, it decides the location and how many walls there are. Otherwise identify the single most logical opening into the space being enclosed (the open side facing the camera, or the doorway into it) and treat it as an open opening: add the enclosure across that opening without altering the architecture.',
  ],
};

/**
 * Existing conditions with nothing in the photo to anchor the glass to. The
 * wizard requires a drawn placement path for these; for every other
 * condition the path is optional and overrides the inferred opening.
 */
export const requiresPlacementPath = (condition: RoomEnclosureExistingCondition | null): boolean =>
  condition === null || condition === 'open_floor' || condition === 'none';

/**
 * Rendered when the consumer drew a floor path on their photo. The path is
 * burned in bright magenta onto a black-and-white reference copy of input_1
 * (see `lib/room-enclosure/placementImage.ts`) that travels after the photos.
 * The corner positions are also written out in the prompt text
 * (`describePlacementCorners`), so placement does not depend on the image alone.
 */
export const PLACEMENT_PATH_RULES: readonly string[] = [
  "- A black-and-white reference copy of input_1 follows with a BRIGHT MAGENTA PATH drawn on the floor: one or more connected straight segments with a dot at every corner. The path is the customer's instruction for WHERE the glass walls stand. Each segment is ONE straight full-height glass wall: its bottom edge runs exactly along that segment, at the same position and in the same perspective as in input_1, and the panels rise vertically from it to the ceiling (or the stair underside).",
  '- EXACT POSITION: each corner dot is the exact point where the glass meets the floor. The bottom edge of the glass touches the floor exactly at the dots, so the enclosure is exactly as wide and as deep as the path. Do NOT push the glass back toward the far wall, into the plane of a window or behind furniture, and do NOT pull it toward the camera. Where a window or door sits on the wall beyond the path, the glass stands in front of it, on the path, and the window stays fully visible behind the glass.',
  '- Where two segments meet, the glass walls meet at a corner: a polished glass-to-glass corner joint for frameless, a slim corner post for framed and grid. The floor area between the path and the existing walls becomes the new enclosed room; everything outside it stays open.',
  '- The path overrides any opening you would otherwise infer: do not move the glass to a nearby doorway, alcove edge or wall if the path is elsewhere, and do not add walls the path does not show or drop walls it does.',
  '- TRACED OUTLINES: if a segment runs up a wall, up a column or along the underside of a stair instead of across the floor, the customer traced the EDGE of the glass, not another wall. Treat the segments on the floor as the base of the glass and the traced segments as where its side and top edges stop. A traced segment never becomes an extra glass wall.',
  '- Where an end of the path is within about a foot of a wall, column or the stair, close that gap with glass. Where an end stops in open floor, that is where the glass ends: a clean polished edge (frameless) or a slim end jamb (framed and grid), never a half-height or stub panel.',
  '- Put the door on one of the segments at the natural approach to the new room.',
  '- The magenta path is an instruction only. The output contains NO magenta, pink or purple line, dot or outline anywhere — not on the floor, not along the glass edges, not along the stair. The edges of the glass carry only the hardware of the selected style. Nothing else is copied from the reference copy either: it is black-and-white only so it cannot be mistaken for the photo; the output keeps the full color, crop, lighting and framing of input_1, which remains the only canvas.',
];

/** Description sent with the marked-up reference copy (see `ReferenceImage.description`). */
export const PLACEMENT_REFERENCE_DESCRIPTION =
  'REFERENCE — CUSTOMER PLACEMENT PATH (NOT A CANVAS). The next image is a black-and-white copy of input_1 with a bright magenta path drawn on the floor by the customer: one or more connected straight segments with a dot at each corner. It shows WHERE the new glass walls stand: each segment is one full-height glass wall whose bottom edge touches the floor exactly along that segment, and walls meet at a glass corner where segments meet. Use this image for placement only. Do NOT reproduce the magenta path, its dots or any pink or purple line in the output, and do not copy anything else from it (it is black-and-white on purpose); input_1, in full color, is the only canvas to edit.';

/**
 * The drawn corners in words, as percentages of the photo, so the model has
 * the placement in text as well as in the reference image. Coordinates are
 * normalized 0..1 (see `RoomEnclosurePlacementPoint`). Returns '' when there
 * is no usable path.
 */
export function describePlacementCorners(points: readonly { x: number; y: number }[] | null | undefined): string {
  if (!points || points.length < 2) return '';
  const pct = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 100);
  const segments = points.length - 1;
  const corners = points
    .map((p, i) => `corner ${i + 1} at ${pct(p.x)}% from the left edge and ${pct(p.y)}% down from the top edge of input_1`)
    .join('; ');
  return `${segments} ${segments === 1 ? 'segment' : 'segments'} through ${points.length} corners, in order: ${corners}. Segment n runs from corner n to corner n+1.`;
}

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
  dining_room: [
    '- DINING ROOM: a full-height glass wall across the open side or the doorway of the dining room, with the door at the natural entry from the adjoining room. The table, chairs, sideboard, rug and light fixture stay inside, exactly as photographed, and remain fully visible through the glass.',
    '- The glass never runs through or in front of the table, chairs or sideboard; if the opening is partly blocked by furniture, the glass stands on the room side of the opening line and the furniture stays where it is.',
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
  '  • metal frame profiles visible around the glass edges, with mullions only between panels and a framed door → FRAMED (slim profiles, no grid)',
  '  • bare polished glass edges held by clamps or by a floor / ceiling channel, with compact hinges → FRAMELESS (rendered with small clamps only, never a channel)',
  '  • a divided-lite, grid, steel-window or French-door look (bars dividing each panel into several panes) → GRID with a regular rectangular grid of panes',
  '  • a heavy commercial storefront look → FRAMED with slim profiles and NO grid of small panes',
  '- Use exactly one style consistently for every panel and the door. Do not mix framed, frameless and grid in the same enclosure.',
];

/** Match Inspiration with no explicit finish selection (shared mapping). */
export const INSPIRATION_FINISH_MAPPING: readonly string[] = METAL_FINISH_INSPIRATION_MAPPING;

/** Inspiration rules plus the unsupported-type mapping for the Match Inspiration path. */
export const INSPIRATION_RULES: readonly string[] = [
  '- input_2 controls STYLE only: framed vs. frameless vs. grid appearance, hardware style, door and handle style, and finish.',
  '- input_1 controls SPACE and GEOMETRY. Do NOT copy the room, the opening size, the racks, the furniture, the background or the architecture from input_2. Determine enclosure placement from input_1 and the placement rules above.',
  ...INSPIRATION_TARGET_ONLY_RULES,
  '- Precedence: explicit consumer selection > inspiration image > backend defaults. Any selection listed in the ENCLOSURE_SPECIFICATION overrides what input_2 shows.',
  '- Map whatever input_2 shows onto exactly ONE approved Gatsby Glass style (FRAMED with slim profiles, FRAMELESS, or GRID) with a swinging glass door. Never copy an unsupported enclosure type from input_2:',
  ...UNSUPPORTED_ENCLOSURE_TYPES.map(
    (t) => `  • ${t.label} → render as ${STYLE_FALLBACK_LABEL[t.mapsTo]} instead`
  ),
];

/** Approved vocabulary + the explicit never-render list. */
export const UNSUPPORTED_TYPE_RULES: readonly string[] = [
  'NOT APPROVED (never render these, on either path, even if they appear in an inspiration photo):',
  ...UNSUPPORTED_ENCLOSURE_TYPES.map((t) => `- ${t.label}`),
  '- Restrict visuals to Gatsby Glass approved enclosure families: Framed (slim metal profiles), Frameless (clamps only) or Grid (slim frame with a regular rectangular grid of panes), full height, clear glass, with a swinging glass door and the selected finish.',
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
