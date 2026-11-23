/**
 * Gatsby Glass Room Enclosure Module prompt templates
 *
 * Hidden backend prompt logic for glass room enclosure renders (wine rooms,
 * under-stair displays, home offices and other interior glass rooms). The
 * consumer only ever supplies the Room Type, Enclosure Style and Finish
 * (plus a design mode and photos); every placement, door, preservation and
 * style-interpretation rule below is applied automatically.
 *
 * Mirrors the railing template structure: fixed base + preservation;
 * existing condition; room-type placement; style; door; finish;
 * inspiration; guardrails + self-check.
 *
 * Variables are produced by `lib/room-enclosure/promptBuilder.ts`
 * (`roomEnclosurePromptVariables`). Optional selections are left undefined
 * in inspiration mode so their `equals` sections are skipped.
 */

import type { PromptTemplate } from '@repo/prompt-templates';
import {
  STYLE_RULES,
  DOOR_RULES,
  GLASS_RULES,
  FINISH_RULES,
  PRESERVATION_RULES,
  BACKGROUND_GLASS_PRESERVATION_RULES,
  EXISTING_CONDITION_RULES,
  PLACEMENT_PATH_RULES,
  APPLICATION_RULES,
  INSPIRATION_STYLE_MAPPING,
  INSPIRATION_FINISH_MAPPING,
  INSPIRATION_RULES,
  UNSUPPORTED_TYPE_RULES,
} from '../lib/room-enclosure/rules';

export const ROOM_ENCLOSURE_VISUALIZATION_TEMPLATE_ID = 'room-enclosure-visualization-v1';
export const ROOM_ENCLOSURE_SYSTEM_TEMPLATE_ID = 'room-enclosure-system-v1';
export const ROOM_ENCLOSURE_VALIDATION_TEMPLATE_ID = 'room-enclosure-validation-v1';

const META = {
  createdAt: '2026-11-06T00:00:00.000Z',
  updatedAt: '2026-11-23T00:00:00.000Z',
  author: 'Gatsby Glass Team',
};

// ---------------------------------------------------------------------------
// VISUALIZATION TEMPLATE (both consumer paths)
// ---------------------------------------------------------------------------

export const roomEnclosureVisualizationTemplate: PromptTemplate = {
  id: ROOM_ENCLOSURE_VISUALIZATION_TEMPLATE_ID,
  version: '1.3.0',
  name: 'Glass Room Enclosure Visualization Prompt',
  type: 'visualization',
  description:
    'Hidden prompt for glass room enclosure renders (wine rooms, under-stair, offices). Built from three consumer selections plus automatic image interpretation (existing condition).',
  sections: [
    // -----------------------------------------------------------------
    // Fixed base + path statement
    // -----------------------------------------------------------------
    {
      id: 'fixed_base',
      type: 'header',
      content: [
        "You are editing a photo of a customer's existing interior space (input_1) to install a NEW full-height glass room enclosure: clear glass wall panels plus a glass door that close off the space.",
        'input_1 is the FIXED BASE IMAGE. It controls architecture, geometry, camera viewpoint and scene composition.',
        'Identify from input_1 the opening that closes off the space being enclosed: an open side of a room or alcove, a doorway, the open side of an under-stair cavity, or an existing partition, door or glass that already closes it.',
        'Modify ONLY that opening — add the glass enclosure system and its door hardware. Do not recreate or redesign any other part of the photograph.',
        '',
      ],
    },
    {
      id: 'design_your_own',
      type: 'instructions',
      condition: { variable: 'mode', operator: 'equals', value: 'configure' },
      content: [
        'PATH: Design Your Own. Generate from input_1 plus the selections below. There is NO inspiration or reference image for this render; do not assume one.',
        '',
      ],
    },
    {
      id: 'match_inspiration_intro',
      type: 'instructions',
      condition: { variable: 'mode', operator: 'equals', value: 'inspiration' },
      content: [
        "PATH: Match Inspiration. input_1 is the customer's existing space and is the ONLY canvas. input_2 is an inspiration photo and is a STYLE DONOR ONLY (see INSPIRATION RULES below).",
        '',
      ],
    },

    // -----------------------------------------------------------------
    // Structured summary of the consumer selections
    // -----------------------------------------------------------------
    {
      id: 'spec',
      type: 'specifications',
      content: [
        '<ENCLOSURE_SPECIFICATION>',
        '  task: install_full_height_glass_room_enclosure_in_input_1',
        '  room_type: {{application_name}} — {{application_descriptor}}',
        '  existing_condition_in_photo: {{existing_condition}}',
        '  placement: {{placement_name}}',
        '  enclosure_style: {{style_name}}',
        '  finish: {{finish_name}}',
        '  door: one swinging glass door (hinged or pivot) at the natural entry, same style and finish',
        '  glass: clear, low-iron look, full height floor to ceiling (or to the stair underside), wide panels, uniform height',
        '</ENCLOSURE_SPECIFICATION>',
        '',
      ],
    },

    // -----------------------------------------------------------------
    // Preservation
    // -----------------------------------------------------------------
    {
      id: 'preservation',
      type: 'instructions',
      content: [
        'PRESERVATION:',
        ...PRESERVATION_RULES,
        ...BACKGROUND_GLASS_PRESERVATION_RULES,
        '- Output pixel dimensions and aspect ratio must match input_1 exactly.',
        '',
      ],
    },

    // -----------------------------------------------------------------
    // Existing condition (automatic from image)
    // -----------------------------------------------------------------
    {
      id: 'existing_condition',
      type: 'instructions',
      content: ['EXISTING CONDITION (automatic from the photo):'],
      children: [
        {
          id: 'open_opening',
          type: 'instructions',
          condition: { variable: 'existing_condition', operator: 'equals', value: 'open_opening' },
          content: [...EXISTING_CONDITION_RULES.open_opening],
        },
        {
          id: 'existing_partition',
          type: 'instructions',
          condition: { variable: 'existing_condition', operator: 'equals', value: 'existing_partition' },
          content: [...EXISTING_CONDITION_RULES.existing_partition],
        },
        {
          id: 'existing_glass',
          type: 'instructions',
          condition: { variable: 'existing_condition', operator: 'equals', value: 'existing_glass' },
          content: [...EXISTING_CONDITION_RULES.existing_glass],
        },
        {
          id: 'open_floor',
          type: 'instructions',
          condition: { variable: 'existing_condition', operator: 'equals', value: 'open_floor' },
          content: [...EXISTING_CONDITION_RULES.open_floor],
        },
        {
          id: 'condition_unknown',
          type: 'instructions',
          condition: { variable: 'existing_condition', operator: 'equals', value: 'none' },
          content: [...EXISTING_CONDITION_RULES.none],
        },
        { id: 'existing_condition_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Room-type placement
    // -----------------------------------------------------------------
    {
      id: 'application_placement',
      type: 'instructions',
      content: ['PLACEMENT ({{application_name}}):', ...GLASS_RULES],
      children: [
        {
          id: 'wine_room',
          type: 'instructions',
          condition: { variable: 'application', operator: 'equals', value: 'wine_room' },
          content: [...APPLICATION_RULES.wine_room],
        },
        {
          id: 'under_stair',
          type: 'instructions',
          condition: { variable: 'application', operator: 'equals', value: 'under_stair' },
          content: [...APPLICATION_RULES.under_stair],
        },
        {
          id: 'home_office',
          type: 'instructions',
          condition: { variable: 'application', operator: 'equals', value: 'home_office' },
          content: [...APPLICATION_RULES.home_office],
        },
        {
          id: 'dining_room',
          type: 'instructions',
          condition: { variable: 'application', operator: 'equals', value: 'dining_room' },
          content: [...APPLICATION_RULES.dining_room],
        },
        {
          id: 'other_room',
          type: 'instructions',
          condition: { variable: 'application', operator: 'equals', value: 'other_room' },
          content: [...APPLICATION_RULES.other_room],
        },
        { id: 'application_placement_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Customer placement path (only when one was drawn). The marked-up
    // reference copy is attached by the API route; see rules.ts.
    // -----------------------------------------------------------------
    {
      id: 'placement_path',
      type: 'instructions',
      condition: { variable: 'placement', operator: 'equals', value: 'drawn' },
      content: ['CUSTOMER PLACEMENT PATH (authoritative for location):', ...PLACEMENT_PATH_RULES, ''],
    },
    {
      id: 'placement_corners',
      type: 'instructions',
      condition: {
        operator: 'and',
        conditions: [
          { variable: 'placement', operator: 'equals', value: 'drawn' },
          { variable: 'placement_corners', operator: 'exists' },
        ],
      },
      content: [
        'PLACEMENT PATH IN WORDS (the same path as the reference image, measured on input_1):',
        '- {{placement_corners}}',
        '- Place each glass bottom edge so it touches the floor at these positions in the output.',
        '',
      ],
    },

    // -----------------------------------------------------------------
    // Style (or from inspiration). Text from lib/room-enclosure/rules.ts
    // -----------------------------------------------------------------
    {
      id: 'style',
      type: 'hardware_specifications',
      content: ['ENCLOSURE STYLE:'],
      children: [
        {
          id: 'style_frameless',
          type: 'hardware_detail',
          condition: { variable: 'style', operator: 'equals', value: 'frameless' },
          content: [
            '- FRAMELESS (hard style lock): install {{style_descriptor}}.',
            ...STYLE_RULES.frameless.must,
            ...STYLE_RULES.frameless.forbidden,
            ...STYLE_RULES.frameless.proportions,
          ],
        },
        {
          id: 'style_framed',
          type: 'hardware_detail',
          condition: { variable: 'style', operator: 'equals', value: 'framed' },
          content: [
            '- FRAMED (hard style lock): install {{style_descriptor}}.',
            ...STYLE_RULES.framed.must,
            ...STYLE_RULES.framed.forbidden,
            ...STYLE_RULES.framed.proportions,
          ],
        },
        {
          id: 'style_grid',
          type: 'hardware_detail',
          condition: { variable: 'style', operator: 'equals', value: 'grid' },
          content: [
            '- GRID (hard style lock): install {{style_descriptor}}.',
            ...STYLE_RULES.grid.must,
            ...STYLE_RULES.grid.forbidden,
            ...STYLE_RULES.grid.proportions,
          ],
        },
        {
          id: 'style_from_inspiration',
          type: 'hardware_detail',
          condition: {
            operator: 'and',
            conditions: [
              { variable: 'mode', operator: 'equals', value: 'inspiration' },
              { variable: 'style', operator: 'not_exists' },
            ],
          },
          content: [
            ...INSPIRATION_STYLE_MAPPING,
            '- Whichever style you choose, obey its proportions: frameless glass is held only by small square clamps about 2 inches across (never a channel); framed profiles are slim flat bars about 1 to 1.5 inches wide with a mullion at every panel joint and a fully framed door; grid uses the same slim frame plus flat bars dividing every panel and the door into the same regular grid of tall rectangular panes, with the horizontal bars level across the whole enclosure.',
          ],
        },
        { id: 'style_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Door (mandatory for every render)
    // -----------------------------------------------------------------
    {
      id: 'door',
      type: 'hardware_specifications',
      content: ['DOOR (mandatory for every render):', ...DOOR_RULES],
      children: [
        {
          id: 'door_frameless',
          type: 'hardware_detail',
          condition: { variable: 'style', operator: 'equals', value: 'frameless' },
          content: [...STYLE_RULES.frameless.door],
        },
        {
          id: 'door_framed',
          type: 'hardware_detail',
          condition: { variable: 'style', operator: 'equals', value: 'framed' },
          content: [...STYLE_RULES.framed.door],
        },
        {
          id: 'door_grid',
          type: 'hardware_detail',
          condition: { variable: 'style', operator: 'equals', value: 'grid' },
          content: [...STYLE_RULES.grid.door],
        },
        {
          id: 'door_from_inspiration',
          type: 'hardware_detail',
          condition: { variable: 'style', operator: 'not_exists' },
          content: [
            '- Build the door to match the style you chose from input_2: a frameless glass door on compact pivot / wall-mount hinges with a tall pull handle, a slim-framed glass door on hinges with a lever or pull handle, or (grid) a framed door carrying the same grid as the panels. Hinges on one edge, handle on the other. Hardware in the selected finish.',
          ],
        },
        { id: 'door_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Finish (or from inspiration)
    // -----------------------------------------------------------------
    {
      id: 'finish',
      type: 'hardware_specifications',
      content: ['FINISH:'],
      children: [
        {
          id: 'finish_selected',
          type: 'hardware_detail',
          condition: { variable: 'finish', operator: 'exists' },
          content: ['- Selected finish: {{finish_descriptor}}.', ...FINISH_RULES],
        },
        {
          id: 'finish_from_inspiration',
          type: 'hardware_detail',
          condition: {
            operator: 'and',
            conditions: [
              { variable: 'mode', operator: 'equals', value: 'inspiration' },
              { variable: 'finish', operator: 'not_exists' },
            ],
          },
          content: [...INSPIRATION_FINISH_MAPPING, ...FINISH_RULES],
        },
        { id: 'finish_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Inspiration rules + unsupported-type mapping
    // -----------------------------------------------------------------
    {
      id: 'inspiration_rules',
      type: 'instructions',
      condition: { variable: 'mode', operator: 'equals', value: 'inspiration' },
      content: ['INSPIRATION RULES:', ...INSPIRATION_RULES, ''],
    },

    // -----------------------------------------------------------------
    // Guardrails — real-install look + self-check
    // -----------------------------------------------------------------
    {
      id: 'guardrails',
      type: 'instructions',
      content: [
        'REAL GATSBY GLASS INSTALL LOOK (modeled on actual glass partition installs):',
        '- Glass: full-height clear low-iron-look panels with polished edges, WIDE panels (about 3 to 5 feet) with as few vertical joints as the opening allows, uniform height, no tint or frost, the room behind fully visible.',
        '- Frameless hardware: small square clamps (about 2 inches) in the selected finish, a few per edge at the floor, ceiling and walls — no channel or track on any edge; hairline glass-to-glass joints; two compact hinges or a pivot pair on one edge of the door and a tall pull on the other.',
        '- Framed hardware: slim flat metal profiles about 1 to 1.5 inches wide around every panel and the door, a mullion at every panel joint, never a grid.',
        '- Grid hardware: the same slim framed system plus flat grid bars of the same width dividing every panel and the door into tall rectangular panes about 1.5 to 2.5 feet wide, with every horizontal bar level across the whole enclosure.',
        '- Scale check: hardware is a small fraction of the glass height. Glass ~8 ft; clamp ~2 in; frame profile and grid bar ~1 to 1.5 in; door ~36 in wide; handle ~12 to 24 in. The glass dominates the view; all hardware reads as fine detail.',
        '',
        ...UNSUPPORTED_TYPE_RULES,
        '',
        'RENDER QUALITY:',
        '- Keep glass panels, joints, clamps or frames, hinges and the handle visually consistent, evenly organized and realistic for the available geometry. Avoid random panel widths, unnecessary joints or mixed styles.',
        '- Glass must be clearly VISIBLE: render edge highlights, subtle reflections, the hardware in the selected finish and the door. A render where the glass cannot be seen is a FAILED render.',
        "- Match input_1's lighting direction, color temperature, shadows, perspective and lens. The result must look like a professional installation photo of the SAME space.",
        '- This is a design visualization, not an engineered drawing. Keep heights, panel widths and door size plausible; exact engineering is confirmed later by the local Gatsby Glass team.',
        '',
        'SELF-CHECK BEFORE OUTPUT:',
        '1. Is the output the same space as input_1 with the same viewpoint, crop and surroundings?',
        '2. Is the new glass enclosure clearly visible across the correct opening — full height, full width, tight to the floor, walls and ceiling — and nowhere else?',
        '3. Is exactly ONE style used (slim FRAMED, FRAMELESS or GRID) on every panel and the door, with ONE finish on all hardware?',
        '4. Is there exactly one obvious swinging glass door with visible hinges and a handle at the natural entry (a pair only for a very wide opening)? No sliding, barn or folding door?',
        '4b. Are ALL of the door hinges (or its pivots) on ONE vertical edge and the handle on the OPPOSITE edge, with no hinge, clamp or fitting on the handle edge? Is the door a full walk-through size (about 36 inches wide)? If not, redo.',
        '5. Did anything unrelated change (racks, bottles, furniture, flooring, stairs, lighting, walls)? If yes, redo.',
        '5b. Is every window, glass door, mirror, railing or piece of metalwork OTHER than the target enclosure identical to input_1? If any was recolored, reframed or removed, redo.',
        '5c. Under-stair: does the top edge of the glass follow the underside of the stair, with the stair itself untouched and no glass on the treads? If not, redo.',
        '6. SCALE: is the hardware slim next to the glass — small clamps about 2 inches across (frameless), or frame profiles and grid bars about 1 to 1.5 inches wide (framed, grid)? If the hardware is thicker than two fingers, redo with slimmer hardware.',
        '6b. Frameless: is there ANY continuous channel, track or metal strip along the floor, ceiling, walls or stair? If yes, remove it and hold the glass with clamps only. Is every transom above the door clamped too? Framed: is there a mullion at every panel joint and a frame around the door? Grid: does every panel AND the door carry the same grid, with the horizontal bars level across the whole enclosure and the room still visible through the panes? If not, redo.',
        '7. Does the render contain any NOT APPROVED element (a grid on a Framed or Frameless enclosure, decorative or wood grilles, heavy storefront, wood frame, barn-door track, tinted or frosted glass, half-height glass)? If yes, redo.',
        '8. If a customer placement path was provided: does every floor segment have a full-height glass wall standing exactly on it — touching the floor at the corner dots, not set back toward a window or wall — with the walls meeting at a glass corner where segments meet and no walls added or dropped? If not, redo.',
        '9. Is there any magenta, pink or purple line, dot or outline anywhere in the output (on the floor, along the glass edges or along the stair)? If yes, remove it: the output must look like an untouched photo with only the glass enclosure added.',
      ],
    },
  ],
  variables: [
    { name: 'mode', type: 'string', required: true, description: 'configure | inspiration' },
    { name: 'existing_condition', type: 'string', required: true, default: 'none', description: 'From image validation' },
    { name: 'placement', type: 'string', required: true, default: 'inferred', description: 'drawn | inferred' },
    { name: 'placement_name', type: 'string', required: false, default: 'inferred from the opening in input_1' },
    { name: 'placement_corners', type: 'string', required: false, description: 'Drawn corners in words (drawn only)' },
    { name: 'application', type: 'string', required: true },
    { name: 'application_name', type: 'string', required: true },
    { name: 'application_descriptor', type: 'string', required: true },
    { name: 'style', type: 'string', required: false },
    { name: 'style_name', type: 'string', required: false, default: 'as shown in the inspiration photo' },
    { name: 'style_descriptor', type: 'string', required: false },
    { name: 'finish', type: 'string', required: false },
    { name: 'finish_name', type: 'string', required: false, default: 'as shown in the inspiration photo' },
    { name: 'finish_descriptor', type: 'string', required: false },
  ],
  metadata: {
    ...META,
    tags: ['room-enclosure', 'visualization', 'photorealistic'],
    notes:
      'v1.3.0 — Grid style (slim frame + regular rectangular divided-lite grid, level across the enclosure) and Dining Room room type, per Gatsby leadership after QA round 1. Half-height partitions stay banned. v1.2.0 — QA round 1 (2026-11): frameless is clamp-mounted (no channel, transoms clamped), framed needs a mullion at every joint and a framed door, hinges on one door edge only, walk-through door size, exact drawn-corner placement (also sent as text), traced-outline paths, no magenta in the output. v1.1.0 — Customer placement path (magenta reference copy, one glass wall per segment) + open-floor condition. v1.0.0 — Initial room enclosure prompt (framed / frameless, shared metal finishes, wine room / under-stair / office / other placement).',
  },
};

// ---------------------------------------------------------------------------
// SYSTEM TEMPLATE
// ---------------------------------------------------------------------------

export const roomEnclosureSystemTemplate: PromptTemplate = {
  id: ROOM_ENCLOSURE_SYSTEM_TEMPLATE_ID,
  version: '1.1.0',
  name: 'System Prompt for Gemini (glass room enclosure)',
  type: 'system',
  description: 'System-level instructions for glass room enclosure renders.',
  sections: [
    {
      id: 'role',
      type: 'header',
      content: [
        'You are an AI image generation assistant for Gatsby Glass, a high-end custom glass company.',
        "Your task is to edit a customer's photo of an interior space — a wine room, the space beneath a staircase, a home office, a lounge, or another room or alcove — to show a NEW full-height glass enclosure (glass wall panels plus a swinging glass door) installed across the opening that closes off that space.",
      ],
    },
    {
      id: 'universal_rules',
      type: 'instructions',
      content: [
        '',
        'UNIVERSAL RULES (apply to every generation, override any conflicting interpretation of the user prompt):',
        '',
        "A. TARGET IDENTITY — the output is input_1's space",
        '   1. The output must be the SAME space as input_1: same architecture, flooring, walls, ceiling, stairs, racks, furniture, lighting and camera viewpoint.',
        '   2. NEVER substitute a different space, a stock photo, or the inspiration photo (input_2 if provided) as the output.',
        '   3. Output pixel dimensions and aspect ratio must EXACTLY match input_1.',
        '',
        'B. PRESERVATION — nothing unrelated changes',
        '   1. Preserve every element that is not the enclosure exactly as shown: structure, trim, floors, walls, ceilings, stairs, windows, doors elsewhere, wine racks and bottles, shelving, furniture, decor and lighting.',
        '   2. Do not move, mirror, duplicate, recolor or remove any unrelated object. Do not add racks, bottles or furniture. Do not widen, reshape or relocate the opening, the stair or the room to fit the enclosure.',
        '   3. Only the target opening changes — the one opening (or existing partition / door / glass) that closes off the space, including all of its panels and its door. Every OTHER window, glass door, mirror, railing or metalwork in input_1 keeps its exact color, finish, material and style.',
        '',
        'C. REMOVAL — only the existing closure',
        '   1. Remove ONLY an existing partition, door, screen or glass at the enclosure location when the specification says so. Never remove full-height structural walls or unrelated structure.',
        '',
        'D. NEW INSTALL — installing the enclosure is the entire purpose',
        '   1. The output MUST visibly contain the new glass enclosure and its door. Returning the input unchanged, or an image where no glass, door or hardware can be seen, is a FAILURE.',
        '   2. Use exactly ONE approved style for all panels and the door (slim FRAMED, FRAMELESS or GRID) and ONE hardware finish.',
        '   3. Glass is clear, full height and evenly organized with consistent panel widths. A grid of panes appears ONLY when the specification selects the GRID style. No heavy storefront framing, wood frames or grilles, barn-door tracks, tinted or frosted glass, or half-height partitions.',
        '   4. Every render includes one swinging glass door (hinged or pivot) with visible hinges and a handle.',
        '',
        'E. PHOTOREALISM',
        "   1. Match input_1's lighting direction, color temperature, intensity, shadows, reflections, perspective and lens.",
        '   2. The result must be indistinguishable from a professional installation photo of input_1.',
        '',
        'F. FOLLOWING THE SPECIFICATION',
        '   1. The user prompt provides an <ENCLOSURE_SPECIFICATION> and ordered rules. Treat them as the source of truth. Run the SELF-CHECK before producing the image.',
      ],
    },
  ],
  variables: [],
  metadata: { ...META, tags: ['room-enclosure', 'system', 'gemini'], notes: 'v1.1.0 — Grid is an approved style. v1.0.0 — Initial room enclosure system prompt.' },
};

// ---------------------------------------------------------------------------
// VALIDATION TEMPLATE
// ---------------------------------------------------------------------------

export const roomEnclosureValidationTemplate: PromptTemplate = {
  id: ROOM_ENCLOSURE_VALIDATION_TEMPLATE_ID,
  version: '1.1.0',
  name: 'Room Enclosure Image Validation Prompt',
  type: 'validation',
  description:
    'Validates that an uploaded photo shows an interior space where a glass room enclosure could be installed, and detects the room type and existing closure condition.',
  sections: [
    {
      id: 'task',
      type: 'header',
      content: [
        'Analyze this image to determine if it shows an interior space where a glass room enclosure (full-height glass wall panels with a glass door) could be installed to close off part of the space.',
      ],
    },
    {
      id: 'guidelines',
      type: 'instructions',
      content: [
        '',
        'VALIDATION GUIDELINES — BE LENIENT:',
        '',
        'ACCEPT (isValid: true) if you see ANY of these:',
        '- A wine room, wine cellar, wine wall, wine display or tasting area (with or without an existing door or glass)',
        '- The open space beneath a staircase (a nook, cavity or closet under the stairs)',
        '- A home office, study, den, library or reading nook, open to or separated from an adjoining room',
        '- A dining room or dining area, open to or separated from an adjoining room',
        '- Any interior room, alcove, lounge, gym, pantry, closet, display space or doorway where a glass wall and door could be installed',
        '- Any ordinary interior room (living room, great room, basement, dining area, bedroom) where part of the space could be partitioned off with new glass walls to create a wine room, office or display room — there does NOT need to be an existing opening, nook, door or glass to replace',
        '- A wine rack, desk, bar or display area sitting in open floor space with no walls around it (the customer will draw where the glass goes)',
        '- An existing glass partition, glass door or interior door that could be replaced with glass',
        '- A product, showroom, or catalog photo of a glass wine room, glass partition or glass enclosure (used as an inspiration photo)',
        '',
        'REJECT (isValid: false) ONLY if the image is clearly:',
        '- A bathroom, shower, or tub',
        '- Purely an outdoor scene with no interior space (a deck, pool, yard or exterior facade)',
        'Never reject an interior photo for lacking a staircase, balcony, edge, nook or opening: a plain room is a valid place to create a glass room.',
        '- A document, screenshot, drawing, or text',
        '- Completely unrelated to a home or building interior',
      ],
    },
    {
      id: 'detection',
      type: 'specifications',
      content: [
        '',
        'DETECTION (if valid):',
        'existingCondition — what currently closes off the space where the enclosure would go:',
        "- 'open_opening': the space is open to the camera / the adjoining room with no wall, door or glass closing it (an open alcove, an open under-stair cavity, a doorless opening, an open side of a room)",
        "- 'existing_partition': a solid wall, door, screen, curtain or partition currently closes the space",
        "- 'existing_glass': a glass wall, glass door or glass enclosure already closes the space",
        "- 'open_floor': the area to enclose (wine racks, a desk, a bar, a corner) sits in open floor space with NO walls, header, doorway, alcove or stair that would frame a glass wall — a new wall would have to stand in the open",
        "- 'none': cannot tell",
        "Prefer 'open_opening' whenever the space has at least two sides and a top edge (an alcove, a nook, an under-stair cavity, a doorway); use 'open_floor' only when nothing frames it.",
        'detectedApplication — which room type the photo best fits:',
        "- 'wine_room': wine racks, bottles, a wine cellar or wine display are the main subject",
        "- 'under_stair': the space beneath a staircase is the main subject",
        "- 'home_office': a desk, workstation, study or library is the main subject",
        "- 'dining_room': a dining table with chairs (a dining room or dining area) is the main subject",
        "- 'other_room': another interior room, alcove, lounge, gym, pantry, closet or display space",
        "- 'unknown': cannot tell",
        'If the photo shows wine racks under a staircase, prefer under_stair.',
      ],
    },
    {
      id: 'response_format',
      type: 'custom',
      content: [
        '',
        'RESPONSE:',
        'Return JSON with isValid (boolean), reason (string, only if invalid), contentFlag (string), existingCondition (string), and detectedApplication (string).',
        '',
        'When in doubt, ACCEPT the image as valid.',
      ],
    },
  ],
  variables: [],
  metadata: { ...META, tags: ['room-enclosure', 'validation', 'image-analysis'], notes: 'v1.1.0 — Detects dining rooms. v1.0.0 — Initial room enclosure validation prompt.' },
};

// ---------------------------------------------------------------------------
// EXPORT MAP (merged into the brand template map by lib/registerTemplates.ts)
// ---------------------------------------------------------------------------

export const roomEnclosureTemplates: Record<string, PromptTemplate> = {
  [ROOM_ENCLOSURE_VISUALIZATION_TEMPLATE_ID]: roomEnclosureVisualizationTemplate,
  [ROOM_ENCLOSURE_SYSTEM_TEMPLATE_ID]: roomEnclosureSystemTemplate,
  [ROOM_ENCLOSURE_VALIDATION_TEMPLATE_ID]: roomEnclosureValidationTemplate,
};
