/**
 * Gatsby Glass Railing Module — compatibility and guardrail rules
 *
 * Single source of truth for what the railing visualizer may render. Both
 * consumer paths (Design Your Own and Match Inspiration) go through these
 * rules: the prompt template renders its system / handrail / finish / pool
 * gate / unsupported-type sections from the constants below, and
 * `validateRailingSelections` blocks any selection that is not an approved
 * family before a prompt is assembled.
 *
 * Source: docs/railing-product-detials — Backend Coding sheet B04–B08,
 * B09, B16–B18, B20–B22, B26–B27, plus proportions observed in real Gatsby
 * Glass install photos.
 *
 * Pure data + pure functions. No React, no I/O.
 */

import type {
  RailingSystem,
  RailingHandrail,
  RailingFinish,
  RailingPayload,
  RailingMode,
} from './types';

// ---------------------------------------------------------------------------
// Approved families
// ---------------------------------------------------------------------------

export const APPROVED_RAILING_SYSTEMS: readonly RailingSystem[] = ['base_shoe', 'spigot'];
export const APPROVED_HANDRAILS: readonly RailingHandrail[] = ['top_mount', 'side_mount', 'no_handrail'];
export const APPROVED_FINISHES: readonly RailingFinish[] = [
  'matte_black',
  'brushed_stainless',
  'polished_stainless',
];

/**
 * Compatibility matrix: which handrail treatments each system supports.
 * Every approved system supports every approved handrail today; the matrix
 * exists so a future restriction is a data change, not a prompt rewrite.
 */
export const SYSTEM_HANDRAIL_COMPATIBILITY: Record<RailingSystem, readonly RailingHandrail[]> = {
  base_shoe: ['top_mount', 'side_mount', 'no_handrail'],
  spigot: ['top_mount', 'side_mount', 'no_handrail'],
};

// ---------------------------------------------------------------------------
// Unsupported railing types (never rendered, on either path)
// ---------------------------------------------------------------------------

export interface UnsupportedRailingType {
  id: string;
  /** Prompt-facing description of what must never appear. */
  label: string;
  /** Inspiration path: the approved system an inspiration photo of this type maps to. */
  mapsTo: RailingSystem;
}

export const UNSUPPORTED_RAILING_TYPES: readonly UnsupportedRailingType[] = [
  { id: 'cable_rail', label: 'cable rail or wire-rope infill', mapsTo: 'spigot' },
  { id: 'picket_rail', label: 'picket, baluster or spindle rail', mapsTo: 'base_shoe' },
  {
    id: 'framed_post',
    label: 'framed-post systems: vertical posts between panels, posts with glass clamps, round tube top rails carried on posts',
    mapsTo: 'base_shoe',
  },
  { id: 'horizontal_bar', label: 'horizontal bar rail', mapsTo: 'base_shoe' },
  { id: 'wood_rail', label: 'wood, composite or vinyl rail', mapsTo: 'base_shoe' },
  { id: 'framed_glass', label: 'framed or channel-edged glass panels, tinted or frosted glass', mapsTo: 'base_shoe' },
  { id: 'mixed_system', label: 'mixing base shoe and spigots in the same run', mapsTo: 'base_shoe' },
];

// ---------------------------------------------------------------------------
// Prompt rule text (consumed by prompts/railing-templates.ts)
// ---------------------------------------------------------------------------

export interface SystemRuleSet {
  /** Positive behavior. */
  must: readonly string[];
  /** Hard negatives — anything here in a render is a failure. */
  forbidden: readonly string[];
  /** Observed proportions from real installs. */
  proportions: readonly string[];
  /** Pool-specific gate interaction (B17 / B18). */
  poolGate: readonly string[];
}

export const SYSTEM_RULES: Record<RailingSystem, SystemRuleSet> = {
  base_shoe: {
    must: [
      '- Every fixed glass panel sits in ONE continuous low-profile base shoe along the required railing line. The bottom edge of each panel visibly enters the shoe.',
    ],
    forbidden: [
      '- HARD LOCK: if ANY spigots, floor-mounted posts, clamps or vertical frames appear in the fixed runs, the render FAILS.',
    ],
    proportions: [
      '- MOUNTING PROPORTIONS (critical — the most common error is a shoe that is far too tall):',
      '  • HEIGHT: about 2 to 2.5 inches above the finished floor — the height of a baseboard or a hand held sideways. Never more than 3 inches. Against a 42-inch glass panel the shoe is under one-fifteenth of the total height. If the shoe looks taller than a hand is wide, it is WRONG — make it thinner.',
      '  • WIDTH: about 2.5 inches, barely wider than the glass. From above it is a narrow strip; from the side it is a thin dark band. It is NOT a curb, a step, a ledge, a planter, a bench or a box — nothing you could stand on or set a cup on.',
      '  • FORM: one straight, crisp rectangular extrusion with flat faces, continuous and uniform along the whole run, in the selected finish; flat top face with the glass entering a narrow slot in the center; no visible bolts, no segment gaps, no end caps sticking up, no trim or cladding bulk.',
      '  • PLACEMENT: sits directly ON the finished floor / deck surface at the edge, tight to the edge. On a stair it runs as a continuous raked channel parallel to the stair pitch along the nosing line. Do not sink it into the floor and do not raise it on a curb.',
      '  • The glass dominates the view; the shoe is a thin line of hardware at the bottom.',
    ],
    poolGate: [
      '- Run the continuous base shoe ONLY beneath fixed glass panels. Interrupt the base shoe at the operable gate opening. Do not place a base shoe, spigot or other fixed support directly beneath the gate panel.',
    ],
  },
  spigot: {
    must: [
      '- Spigots read as ONE consistent hardware family, two per panel at even spacing, with open space beneath the glass.',
    ],
    forbidden: [
      '- HARD LOCK: if a continuous bottom channel, base shoe, posts or vertical framing appear, the render FAILS.',
    ],
    proportions: [
      '- MOUNTING PROPORTIONS (critical — the most common error is spigots that are far too tall or too bulky):',
      '  • Each spigot is a small clamp about 5 inches tall and about 2 inches wide — no taller than a coffee mug, a fraction of the 42-inch glass height. If a spigot looks like a post or a block, it is WRONG — make it smaller.',
      '  • Two per panel, set in about 8 to 10 inches from each panel edge, evenly repeated along the run; the glass bottom edge floats about 3 to 4 inches above the floor with clear open space beneath between spigots.',
      '  • Each spigot is a simple rounded or square clamp in the selected finish, bolted flat to the floor / deck surface, gripping only the bottom edge of the glass. No base plates larger than a hand, no vertical posts, no continuous channel.',
      '  • The glass dominates the view; the spigots are small, repeated details at the floor line.',
    ],
    poolGate: [
      '- Use spigots ONLY beneath fixed glass panels. Do not place a spigot directly beneath the operable gate panel. Use gate-specific hinge / latch hardware at the gate.',
    ],
  },
};

export interface HandrailRuleSet {
  must: readonly string[];
  forbidden: readonly string[];
  proportions: readonly string[];
}

/**
 * Coverage: a handrail selection applies to EVERY run of glass in the
 * render, not only the run nearest the camera. Spread into the top- and
 * side-mounted rule sets and used by the Match Inspiration fallback.
 * (Feedback 2026-10-23: a deck render dropped the side rail on the left run.)
 */
export const HANDRAIL_COVERAGE_RULES: readonly string[] = [
  '- COVERAGE: the handrail runs along EVERY glass run in the render — every side of a deck or balcony, every return and corner, the stair flight AND the landing — wrapping continuously around corners. A glass run with no rail while another run has one is a FAILED render.',
];

export const HANDRAIL_RULES: Record<RailingHandrail, HandrailRuleSet> = {
  top_mount: {
    must: [
      '- The rail sits ON the top edge of the glass and caps it, continuous along the whole run.',
      ...HANDRAIL_COVERAGE_RULES,
    ],
    forbidden: [
      '- Do NOT add any second rail on the glass face, and do NOT leave the glass edge exposed above the rail.',
    ],
    proportions: [
      '- PROPORTIONS: a thin square channel about 1 inch tall and 1 inch wide — about finger-thick — hugging the glass edge, continuous and mitered at corners. Not a round tube, not a thick wooden or boxy rail. If the cap looks thicker than two fingers, it is WRONG — make it thinner.',
    ],
  },
  side_mount: {
    must: [
      '- The rail is on the FACE of the glass on small brackets, slightly below the top edge; the glass edge stays visible above it.',
      ...HANDRAIL_COVERAGE_RULES,
    ],
    forbidden: ['- Do NOT add a cap rail on top of the glass, and do NOT merge the rail into the glass edge.'],
    proportions: [
      '- PROPORTIONS: a slim bar about 1.5 inches thick held about 2 inches off the glass by small round standoff pins spaced every few feet, mounted about 3 to 4 inches below the top edge of the glass. Not a thick tube, not a wide flat board, no large brackets.',
    ],
  },
  no_handrail: {
    must: ['- The polished top edge of the glass is the top of the railing: clean, straight and uninterrupted.'],
    forbidden: [
      '- HARD NEGATIVE: no handrail, cap rail, top rail or channel of any kind on or along the glass, except gate hardware or another required connection.',
    ],
    proportions: [],
  },
};

/** B08: the selected finish is applied to every piece of visible hardware. */
export const FINISH_RULES: readonly string[] = [
  '- Apply the selected finish consistently to ALL visible railing hardware: base shoe or spigots, handrail or cap rail, standoff pins, clamps, connectors, gate hinges and latch. ONE finish only — never mixed metals.',
  '- An explicit finish selection overrides any finish shown in an inspiration image.',
];

/** B16: every pool render includes an operable gate. */
export const POOL_GATE_RULES: readonly string[] = [
  '- Include at least one clearly identifiable, functional access gate at a logical pedestrian approach to the pool area. Use appropriate hinges and latch hardware in the selected finish. The gate must read visually as operable and distinct from the fixed glass panels.',
];

/** Gate support rule when the system is left to the inspiration photo. */
export const POOL_GATE_GENERIC_SUPPORT: readonly string[] = [
  '- Never place a base shoe, spigot or other fixed support directly beneath the gate panel; the gate hangs on gate-specific hinges with a latch.',
];

/**
 * B15 / B19: with no existing fence, the enclosure sits back from the
 * water on every side. (Feedback 2026-10-23: a pool render put the
 * right-hand run on the coping.)
 */
export const POOL_SETBACK_RULES: readonly string[] = [
  '- SETBACK (critical — the most common error is glass placed right at the water): keep a clear walkway of deck at least 4 feet (about 1.2 m, the length of a lounge chair) between the glass and the pool coping on EVERY side, including the far side and the sides at the edges of the image. Never place glass on the coping, on the first row of deck beside the coping, or over the water.',
  '- If the hardscape on one side is narrower than 4 feet, run the glass along the OUTER boundary of that hardscape (lawn edge, planting bed, wall) rather than hugging the water.',
];

/**
 * B06 / B20: Match Inspiration with no explicit handrail selection. Maps
 * what input_2 shows onto one approved treatment. A separate graspable
 * rail of any kind is SIDE-MOUNTED; the model must not swap in a cap rail.
 * (Feedback 2026-10-23: a side-rail inspiration photo rendered as a top rail.)
 */
export const INSPIRATION_HANDRAIL_MAPPING: readonly string[] = [
  '- Read the handrail in input_2 and map it to exactly ONE approved treatment:',
  '  • a separate graspable bar on the face of the glass — on brackets, standoffs or posts, at any height → SIDE-MOUNTED rail on small standoff pins, with the glass edge exposed above it',
  '  • a channel, cap or profile sitting on the top edge of the glass → TOP-MOUNTED cap rail',
  '  • a bare polished glass edge with no rail of any kind → NO handrail',
  '- If input_2 shows any separate graspable handrail, render SIDE-MOUNTED. Do NOT substitute a top-mounted cap rail for a true handrail, and do NOT add a cap rail on top of a side-mounted rail.',
  ...HANDRAIL_COVERAGE_RULES,
];

/**
 * B08 / B20: Match Inspiration with no explicit finish selection. Maps the
 * hardware color in input_2 onto one approved finish; the model must not
 * fall back to black. (Feedback 2026-10-23: silver/nickel inspiration
 * hardware rendered as matte black.)
 */
export const INSPIRATION_FINISH_MAPPING: readonly string[] = [
  '- Read the hardware color in input_2 and map it to exactly ONE approved finish:',
  '  • silver, grey, nickel, chrome, satin, brushed, or any light metal that is not mirror-bright → BRUSHED (satin) STAINLESS STEEL',
  '  • bright mirror-polished silver → POLISHED (mirror) STAINLESS STEEL',
  '  • black, charcoal, gunmetal, dark bronze, or any dark metal → MATTE BLACK',
  '  • brass, gold, copper, bronze, wood, or painted colors are NOT approved: use brushed stainless for warm or light tones and matte black for dark tones',
  '- Do NOT default to matte black. Black is correct only when the hardware in input_2 is clearly dark.',
];

/** B09: replacement respects the existing geometry. */
export const EXISTING_RAILING_REPLACEMENT_RULES: readonly string[] = [
  '- An existing railing / guard is visible. REMOVE only the existing railing system and replace it along the SAME railing location, stair slope, landing geometry, balcony edge or deck perimeter. Preserve the supporting architecture. Do not extend the new railing onto adjacent walls or surfaces.',
];

/** B20–B22 plus the unsupported-type mapping for the Match Inspiration path. */
export const INSPIRATION_RULES: readonly string[] = [
  '- input_2 controls STYLE only: railing system appearance, glass configuration, handrail treatment, hardware style, and gate treatment where applicable.',
  '- input_1 controls SPACE and GEOMETRY. Do NOT copy the railing path, dimensions, background, landscaping or architecture from input_2. Determine railing placement from input_1 and the placement rules above.',
  '- Precedence: explicit consumer selection > inspiration image > backend defaults. Any selection listed in the RAILING_SPECIFICATION overrides what input_2 shows.',
  '- Map whatever input_2 shows onto exactly ONE approved Gatsby Glass system (continuous BASE SHOE or individual SPIGOTS) and ONE approved handrail treatment (top-mounted cap rail, side-mounted rail, or none). Never copy an unsupported railing type from input_2:',
  ...UNSUPPORTED_RAILING_TYPES.map(
    (t) => `  • ${t.label} → render as ${t.mapsTo === 'base_shoe' ? 'frameless glass in a base shoe' : 'frameless glass on spigots'} instead`
  ),
];

/** B27: approved vocabulary + the explicit never-render list. */
export const UNSUPPORTED_TYPE_RULES: readonly string[] = [
  'NOT APPROVED (never render these, on either path, even if they appear in an inspiration photo):',
  ...UNSUPPORTED_RAILING_TYPES.map((t) => `- ${t.label}`),
  '- Restrict visuals to Gatsby Glass approved system families: Base Shoe or Spigot, with the approved handrail treatment and the selected finish.',
];

// ---------------------------------------------------------------------------
// Validation (blocks unsupported selections before prompt assembly)
// ---------------------------------------------------------------------------

export interface RailingRuleIssue {
  field: 'mode' | 'application' | 'railing_system' | 'handrail' | 'finish' | 'compatibility';
  message: string;
}

const isOneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value);

/**
 * Checks a payload against the approved families and the compatibility
 * matrix. Returns an empty array when the payload may be rendered.
 *
 * Design Your Own requires every selection. Match Inspiration lets
 * system / handrail / finish be null (taken from the inspiration photo), but
 * anything that IS set must still be an approved value.
 */
export function validateRailingSelections(payload: RailingPayload): RailingRuleIssue[] {
  const issues: RailingRuleIssue[] = [];
  const mode: RailingMode = payload.mode;

  if (mode !== 'configure' && mode !== 'inspiration') {
    issues.push({ field: 'mode', message: `Unknown mode "${String(mode)}"` });
  }

  if (!isOneOf(payload.application, ['interior_staircase', 'interior_balcony', 'exterior_deck', 'pool_balustrade'] as const)) {
    issues.push({ field: 'application', message: `Unsupported application "${String(payload.application)}"` });
  }

  const requireAll = mode === 'configure';

  if (payload.railing_system === null) {
    if (requireAll) issues.push({ field: 'railing_system', message: 'Railing system is required' });
  } else if (!isOneOf(payload.railing_system, APPROVED_RAILING_SYSTEMS)) {
    issues.push({ field: 'railing_system', message: `Unsupported railing system "${String(payload.railing_system)}"` });
  }

  if (payload.handrail === null) {
    if (requireAll) issues.push({ field: 'handrail', message: 'Handrail selection is required' });
  } else if (!isOneOf(payload.handrail, APPROVED_HANDRAILS)) {
    issues.push({ field: 'handrail', message: `Unsupported handrail "${String(payload.handrail)}"` });
  }

  if (payload.finish === null) {
    if (requireAll) issues.push({ field: 'finish', message: 'Finish is required' });
  } else if (!isOneOf(payload.finish, APPROVED_FINISHES)) {
    issues.push({ field: 'finish', message: `Unsupported finish "${String(payload.finish)}"` });
  }

  if (
    payload.railing_system !== null &&
    payload.handrail !== null &&
    isOneOf(payload.railing_system, APPROVED_RAILING_SYSTEMS) &&
    isOneOf(payload.handrail, APPROVED_HANDRAILS) &&
    !SYSTEM_HANDRAIL_COMPATIBILITY[payload.railing_system].includes(payload.handrail)
  ) {
    issues.push({
      field: 'compatibility',
      message: `${payload.railing_system} does not support ${payload.handrail}`,
    });
  }

  return issues;
}

/** Thrown by prompt assembly when a payload fails the rules. */
export class RailingRuleViolationError extends Error {
  readonly issues: RailingRuleIssue[];
  constructor(issues: RailingRuleIssue[]) {
    super(`Railing selections violate the approved rules: ${issues.map((i) => i.message).join('; ')}`);
    this.name = 'RailingRuleViolationError';
    this.issues = issues;
  }
}

export function assertRailingSelectionsRenderable(payload: RailingPayload): void {
  const issues = validateRailingSelections(payload);
  if (issues.length > 0) throw new RailingRuleViolationError(issues);
}
