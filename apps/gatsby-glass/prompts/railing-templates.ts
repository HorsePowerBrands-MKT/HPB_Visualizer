/**
 * Gatsby Glass Railing Module prompt templates
 *
 * Hidden backend prompt logic for glass railing renders. The consumer only
 * ever supplies Application, Railing System, Handrail and Finish (plus a
 * design mode and photos); every placement, gate, preservation and
 * system-interpretation rule below is applied automatically.
 *
 * Source: docs/railing-product-detials — "GatsbyView Railing Backend Prompt
 * Logic" (B01–B30) and "Master Prompt Rules". Section ids reference the
 * logic ids so QA can trace a rendered line back to the sheet. Sections are
 * assembled in the B30 order: fixed-base + preservation; application
 * placement; system; handrail; finish; pool gate; inspiration; no-drift.
 *
 * Variables are produced by `lib/railing/promptBuilder.ts`
 * (`railingPromptVariables`). Optional selections are left undefined in
 * inspiration mode so their `equals` sections are skipped.
 */

import type { PromptTemplate } from '@repo/prompt-templates';
import {
  SYSTEM_RULES,
  HANDRAIL_RULES,
  HANDRAIL_COVERAGE_RULES,
  FINISH_RULES,
  POOL_GATE_RULES,
  POOL_SETBACK_RULES,
  POOL_HEIGHT_RULES,
  INSPIRATION_HANDRAIL_MAPPING,
  INSPIRATION_FINISH_MAPPING,
  POOL_GATE_GENERIC_SUPPORT,
  EXISTING_RAILING_REPLACEMENT_RULES,
  BACKGROUND_RAILING_PRESERVATION_RULES,
  EDGE_FOLLOWING_RULES,
  ACCESS_OPENING_RULES,
  STAIR_PRESERVATION_RULES,
  INSPIRATION_RULES,
  UNSUPPORTED_TYPE_RULES,
} from '../lib/railing/rules';

export const RAILING_VISUALIZATION_TEMPLATE_ID = 'railing-visualization-v1';
export const RAILING_SYSTEM_TEMPLATE_ID = 'railing-system-v1';
export const RAILING_VALIDATION_TEMPLATE_ID = 'railing-validation-v1';

const META = {
  createdAt: '2026-10-12T00:00:00.000Z',
  updatedAt: '2026-10-29T00:00:00.000Z',
  author: 'Gatsby Glass Team',
};

// ---------------------------------------------------------------------------
// VISUALIZATION TEMPLATE (both consumer paths)
// ---------------------------------------------------------------------------

export const railingVisualizationTemplate: PromptTemplate = {
  id: RAILING_VISUALIZATION_TEMPLATE_ID,
  version: '1.3.0',
  name: 'Glass Railing Visualization Prompt',
  type: 'visualization',
  description:
    'Hidden prompt for frameless glass railing renders. Built from four consumer selections plus automatic image interpretation (existing condition).',
  sections: [
    // -----------------------------------------------------------------
    // B01 fixed base + B23 / B20 path statement
    // -----------------------------------------------------------------
    {
      id: 'B01_fixed_base',
      type: 'header',
      content: [
        'You are editing a photo of a customer\'s existing space (input_1) to install a NEW frameless glass railing.',
        'input_1 is the FIXED BASE IMAGE. It controls architecture, geometry, camera viewpoint and scene composition.',
        'Identify from input_1 the existing railing condition: an existing railing or guard, an open edge, a stair guard, a balcony edge, a deck perimeter, or a pool-barrier condition.',
        'Modify ONLY the railing / balustrade system and any directly required gate hardware. Do not recreate or redesign any other part of the photograph.',
        '',
      ],
    },
    {
      id: 'B23_design_your_own',
      type: 'instructions',
      condition: { variable: 'mode', operator: 'equals', value: 'configure' },
      content: [
        'PATH: Design Your Own. Generate from input_1 plus the four selections below. There is NO inspiration or reference image for this render; do not assume one.',
        '',
      ],
    },
    {
      id: 'B20_match_inspiration_intro',
      type: 'instructions',
      condition: { variable: 'mode', operator: 'equals', value: 'inspiration' },
      content: [
        'PATH: Match Inspiration. input_1 is the customer\'s existing space and is the ONLY canvas. input_2 is an inspiration photo and is a STYLE DONOR ONLY (see INSPIRATION RULES below).',
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
        '<RAILING_SPECIFICATION>',
        '  task: install_frameless_glass_railing_in_input_1',
        '  application: {{application_name}} — {{application_descriptor}}',
        '  setting: {{setting}}',
        '  existing_condition_in_photo: {{existing_condition}}',
        '  railing_system: {{system_name}}',
        '  handrail: {{handrail_name}}',
        '  finish: {{finish_name}}',
        '  glass: clear, frameless, tempered-look, uniform panel height, consistent panel rhythm',
        '</RAILING_SPECIFICATION>',
        '',
      ],
    },

    // -----------------------------------------------------------------
    // B02 preservation + B25 no-drift
    // -----------------------------------------------------------------
    {
      id: 'B02_preservation',
      type: 'instructions',
      content: [
        'PRESERVATION (B02 / B25):',
        '- Preserve the staircase, flooring, walls, windows, doors, ceiling, deck or balcony structure, pool, coping, hardscape, furniture, landscaping, pets, lighting, planters, signage and ALL surrounding elements exactly as shown. Do not add people.',
        '- The only exception is when the selected application specifically requires replacement of an existing guard wall (see placement rules).',
        '- Do not move, remove, add, recolor or redesign unrelated objects or surfaces. Do not alter camera viewpoint, crop, architecture, landscaping, furniture, pool shape, hardscape, pets or lighting to accommodate the railing.',
        ...BACKGROUND_RAILING_PRESERVATION_RULES,
        '- Output pixel dimensions and aspect ratio must match input_1 exactly.',
        '',
      ],
    },

    // -----------------------------------------------------------------
    // Existing condition (automatic from image) — B09, B10, B12, B14
    // -----------------------------------------------------------------
    {
      id: 'existing_condition',
      type: 'instructions',
      content: ['EXISTING CONDITION (automatic from the photo):'],
      children: [
        {
          id: 'B09_existing_railing',
          type: 'instructions',
          condition: { variable: 'existing_condition', operator: 'equals', value: 'existing_railing' },
          content: [...EXISTING_RAILING_REPLACEMENT_RULES],
        },
        {
          id: 'B10_open_edge',
          type: 'instructions',
          condition: {
            operator: 'and',
            conditions: [
              { variable: 'existing_condition', operator: 'in', value: ['open_edge', 'none'] },
              { variable: 'application', operator: 'not_equals', value: 'pool_balustrade' },
            ],
          },
          content: [
            '- No existing railing at the edge. ADD the selected glass railing only along the existing open edge or guard line. Use the existing geometry as the placement anchor. Do not reshape, relocate or extend the architectural edge.',
          ],
        },
        {
          id: 'B10_pool_no_barrier',
          type: 'instructions',
          condition: {
            operator: 'and',
            conditions: [
              { variable: 'existing_condition', operator: 'in', value: ['open_edge', 'none'] },
              { variable: 'application', operator: 'equals', value: 'pool_balustrade' },
            ],
          },
          content: [
            '- No existing pool barrier is visible. Place the new enclosure using the pool placement and setback rules below — not along the pool edge.',
          ],
        },
        {
          id: 'B12_half_wall',
          type: 'instructions',
          condition: {
            operator: 'and',
            conditions: [
              { variable: 'existing_condition', operator: 'equals', value: 'half_wall' },
              { variable: 'application', operator: 'in', value: ['interior_staircase', 'interior_balcony'] },
            ],
          },
          content: [
            '- A guard-height half wall / pony wall is functioning as the existing guard. Remove ONLY that guard-height wall along the stair run or edge and replace it with the selected glass railing. Preserve full-height walls, adjacent structure, trim, flooring, ceiling and stair geometry. Do not remove unrelated drywall.',
          ],
        },
        {
          id: 'B12_half_wall_other_application',
          type: 'instructions',
          condition: {
            operator: 'and',
            conditions: [
              { variable: 'existing_condition', operator: 'equals', value: 'half_wall' },
              { variable: 'application', operator: 'not_in', value: ['interior_staircase', 'interior_balcony'] },
            ],
          },
          content: [
            '- A low wall or ledge is present at the edge. Treat it as the existing guard line: install the glass railing along it without altering any full-height wall or structure.',
          ],
        },
        {
          id: 'B14_existing_fence',
          type: 'instructions',
          condition: {
            operator: 'and',
            conditions: [
              { variable: 'existing_condition', operator: 'equals', value: 'existing_fence' },
              { variable: 'application', operator: 'equals', value: 'pool_balustrade' },
            ],
          },
          content: [
            '- An existing pool fence is visible. Use the existing pool-fence line as the placement guide and replace that barrier with the selected glass system. The existing fence is the placement anchor: do NOT move the enclosure closer to the pool. Preserve the pool, coping, deck, landscaping, furniture and architecture. Retain a functional gate at the existing or most logical access location.',
            ...POOL_HEIGHT_RULES,
          ],
        },
        {
          id: 'B14_existing_fence_other_application',
          type: 'instructions',
          condition: {
            operator: 'and',
            conditions: [
              { variable: 'existing_condition', operator: 'equals', value: 'existing_fence' },
              { variable: 'application', operator: 'not_equals', value: 'pool_balustrade' },
            ],
          },
          content: [
            '- An existing fence or barrier is visible along the edge. Replace only that barrier with the selected glass railing along the same line.',
          ],
        },
        { id: 'existing_condition_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Application placement — B11, B13, B15, B19
    // -----------------------------------------------------------------
    {
      id: 'application_placement',
      type: 'instructions',
      content: ['PLACEMENT ({{application_name}}):'],
      children: [
        {
          id: 'B11_interior',
          type: 'instructions',
          condition: { variable: 'application', operator: 'in', value: ['interior_staircase', 'interior_balcony'] },
          content: [
            '- Evaluate the FULL visible guard condition. If both a balcony / landing edge AND a stair flight require railing, apply the selected system to BOTH. Follow the existing stair slope and landing geometry exactly.',
            '- Do not omit the stair railing. Do not create railing over intact drywall or full-height walls.',
            '- Glass along a stair run is raked to match the stair pitch; glass along a landing or balcony edge is level.',
          ],
        },
        {
          id: 'edges_openings_stairs',
          type: 'instructions',
          condition: { variable: 'application', operator: 'not_equals', value: 'pool_balustrade' },
          content: [...EDGE_FOLLOWING_RULES, ...ACCESS_OPENING_RULES, ...STAIR_PRESERVATION_RULES],
        },
        {
          id: 'B13_exterior_deck',
          type: 'instructions',
          condition: { variable: 'application', operator: 'equals', value: 'exterior_deck' },
          content: [
            '- Use the existing deck / patio perimeter and existing railing line as the guide. Replace only the railing. If no railing is present, follow the clearly defined open deck / patio edge rather than inventing a new perimeter.',
            '- Apply the glass AND the selected handrail to EVERY open edge of the deck visible in the photo: the front run, BOTH side returns, and any stair edge. Do not leave a visible open edge unguarded, and do not drop the handrail on a side run.',
            '- Preserve decking, stairs, furniture, house, siding, landscaping, pets, lighting, planters and surrounding structures exactly as shown.',
          ],
        },
        {
          id: 'B15_pool_no_fence',
          type: 'instructions',
          condition: {
            operator: 'and',
            conditions: [
              { variable: 'application', operator: 'equals', value: 'pool_balustrade' },
              { variable: 'existing_condition', operator: 'not_equals', value: 'existing_fence' },
            ],
          },
          content: [
            '- No existing pool barrier. Create a code-conscious glass pool enclosure on the surrounding usable deck / patio area. Do NOT trace or snake around the exact shape of the pool. Favor clean, straighter runs and intentional corners, positioned back from the pool edge to preserve practical circulation space. Do not place the barrier directly on the pool coping unless the site geometry clearly requires it.',
            '- Use the property hardscape and circulation pattern to infer a practical enclosure zone. Keep the pool, pool steps and water completely unobstructed. The perimeter must read as a fence around the pool AREA, not a railing attached to the pool itself. Do not place glass through water, furniture or planting.',
            ...POOL_SETBACK_RULES,
            ...POOL_HEIGHT_RULES,
          ],
        },
        {
          id: 'B15_pool_with_fence_note',
          type: 'instructions',
          condition: {
            operator: 'and',
            conditions: [
              { variable: 'application', operator: 'equals', value: 'pool_balustrade' },
              { variable: 'existing_condition', operator: 'equals', value: 'existing_fence' },
            ],
          },
          content: [
            '- Keep the enclosure on the existing fence line. Keep the pool, pool steps and water completely unobstructed.',
          ],
        },
        { id: 'application_placement_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // System — B04 / B05 (or from inspiration). Text from lib/railing/rules.ts
    // -----------------------------------------------------------------
    {
      id: 'system',
      type: 'hardware_specifications',
      content: ['RAILING SYSTEM:'],
      children: [
        {
          id: 'B04_base_shoe',
          type: 'hardware_detail',
          condition: { variable: 'railing_system', operator: 'equals', value: 'base_shoe' },
          content: [
            '- BASE SHOE (hard system lock): install {{system_descriptor}}.',
            ...SYSTEM_RULES.base_shoe.must,
            ...SYSTEM_RULES.base_shoe.forbidden,
            ...SYSTEM_RULES.base_shoe.proportions,
          ],
        },
        {
          id: 'B05_spigot',
          type: 'hardware_detail',
          condition: { variable: 'railing_system', operator: 'equals', value: 'spigot' },
          content: [
            '- SPIGOT (hard system lock): install {{system_descriptor}}.',
            ...SYSTEM_RULES.spigot.must,
            ...SYSTEM_RULES.spigot.forbidden,
            ...SYSTEM_RULES.spigot.proportions,
          ],
        },
        {
          id: 'system_from_inspiration',
          type: 'hardware_detail',
          condition: {
            operator: 'and',
            conditions: [
              { variable: 'mode', operator: 'equals', value: 'inspiration' },
              { variable: 'railing_system', operator: 'not_exists' },
            ],
          },
          content: [
            '- Use the railing system shown in input_2, mapped to the nearest approved Gatsby Glass system: a continuous BASE SHOE channel, or individual SPIGOT clamps. Use exactly one system consistently for every fixed panel. Do not mix systems.',
            '- Whichever system you choose, obey its proportions: a base shoe is a thin band about 2 inches tall sitting on the floor; spigots are small clamps about 5 inches tall, two per panel.',
          ],
        },
        { id: 'system_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Handrail — B06 / B07 (or from inspiration). Text from lib/railing/rules.ts
    // -----------------------------------------------------------------
    {
      id: 'handrail',
      type: 'hardware_specifications',
      content: ['HANDRAIL:'],
      children: [
        {
          id: 'B06_top_mount',
          type: 'hardware_detail',
          condition: { variable: 'handrail', operator: 'equals', value: 'top_mount' },
          content: [
            '- TOP-MOUNTED (hard lock): add {{handrail_descriptor}}.',
            ...HANDRAIL_RULES.top_mount.must,
            ...HANDRAIL_RULES.top_mount.forbidden,
            ...HANDRAIL_RULES.top_mount.proportions,
          ],
        },
        {
          id: 'B06_side_mount',
          type: 'hardware_detail',
          condition: { variable: 'handrail', operator: 'equals', value: 'side_mount' },
          content: [
            '- SIDE-MOUNTED (hard lock): add {{handrail_descriptor}}.',
            ...HANDRAIL_RULES.side_mount.must,
            ...HANDRAIL_RULES.side_mount.forbidden,
            ...HANDRAIL_RULES.side_mount.proportions,
          ],
        },
        {
          id: 'B07_no_handrail',
          type: 'hardware_detail',
          condition: { variable: 'handrail', operator: 'equals', value: 'no_handrail' },
          content: [
            '- NO HANDRAIL (hard lock): {{handrail_descriptor}}.',
            ...HANDRAIL_RULES.no_handrail.must,
            ...HANDRAIL_RULES.no_handrail.forbidden,
          ],
        },
        {
          id: 'handrail_from_inspiration',
          type: 'hardware_detail',
          condition: {
            operator: 'and',
            conditions: [
              { variable: 'mode', operator: 'equals', value: 'inspiration' },
              { variable: 'handrail', operator: 'not_exists' },
            ],
          },
          content: [
            ...INSPIRATION_HANDRAIL_MAPPING,
          ],
        },
        { id: 'handrail_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Finish — B08 (or from inspiration). Text from lib/railing/rules.ts
    // -----------------------------------------------------------------
    {
      id: 'finish',
      type: 'hardware_specifications',
      content: ['FINISH:'],
      children: [
        {
          id: 'B08_finish',
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
          content: [
            ...INSPIRATION_FINISH_MAPPING,
            ...FINISH_RULES,
          ],
        },
        { id: 'finish_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Pool gate — B16 / B17 / B18 (pool only). Text from lib/railing/rules.ts
    // -----------------------------------------------------------------
    {
      id: 'pool_gate',
      type: 'instructions',
      condition: { variable: 'application', operator: 'equals', value: 'pool_balustrade' },
      content: ['POOL GATE (mandatory for every pool render):', ...POOL_GATE_RULES],
      children: [
        {
          id: 'B17_gate_base_shoe',
          type: 'instructions',
          condition: { variable: 'railing_system', operator: 'equals', value: 'base_shoe' },
          content: [...SYSTEM_RULES.base_shoe.poolGate],
        },
        {
          id: 'B18_gate_spigot',
          type: 'instructions',
          condition: { variable: 'railing_system', operator: 'equals', value: 'spigot' },
          content: [...SYSTEM_RULES.spigot.poolGate],
        },
        {
          id: 'gate_generic_support',
          type: 'instructions',
          condition: { variable: 'railing_system', operator: 'not_exists' },
          content: [...POOL_GATE_GENERIC_SUPPORT],
        },
        { id: 'pool_gate_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Inspiration rules — B20 / B21 / B22 + unsupported-type mapping
    // -----------------------------------------------------------------
    {
      id: 'inspiration_rules',
      type: 'instructions',
      condition: { variable: 'mode', operator: 'equals', value: 'inspiration' },
      content: ['INSPIRATION RULES (B20–B22):', ...INSPIRATION_RULES, ''],
    },

    // -----------------------------------------------------------------
    // Guardrails — real-install look, B26 / B27 / B29 + self-check
    // -----------------------------------------------------------------
    {
      id: 'guardrails',
      type: 'instructions',
      content: [
        'REAL GATSBY GLASS INSTALL LOOK (modeled on actual Gatsby Glass installs):',
        '- Glass: tall full-height guard panels (about 42 in / 1.07 m above the walking surface; about 48 in for pool fences), clear low-iron look with only a faint green edge, polished exposed edges, WIDE panels with as few vertical joints as the run allows (narrow gaps between panels, no frames, no tint, no visible clips on the glass face).',
        '- Base shoe: a thin band at the floor line in the selected finish, about 2 to 2.5 inches tall and 2.5 inches wide, sitting on the floor; under one-fifteenth of the glass height; no visible fasteners.',
        '- Spigots: small clamps about 5 inches tall, two per panel at the very base, glass floating 3 to 4 inches above the floor.',
        '- Cap rail: a thin square channel about 1 inch tall hugging the glass edge; never a round tube.',
        '- Side rail: a round 1.5-inch tube grab rail on compact disc-and-elbow standoff brackets about 2 inches off the glass, 3 to 4 inches below the glass edge.',
        '- Scale check: hardware is a small fraction of the glass height. Glass ~42 in (~48 in at a pool); shoe ~2 in; spigot ~5 in; cap ~1 in. The glass dominates the view; all hardware reads as fine detail.',
        '',
        ...UNSUPPORTED_TYPE_RULES,
        '',
        'RENDER QUALITY (B26 / B27):',
        '- Keep glass panels, joints, spigots, clamps and base-shoe runs visually consistent, evenly organized and realistic for the available geometry. Avoid random support spacing, unnecessary panel breaks or mixed hardware systems.',
        '- Glass must be clearly VISIBLE: render edge highlights, subtle reflections and the hardware in the selected finish. A render where the glass cannot be seen is a FAILED render.',
        "- Match input_1's lighting direction, color temperature, shadows, perspective and lens. The result must look like a professional installation photo of the SAME space.",
        '- This is a design visualization, not an engineered or code-approved drawing. Keep heights and spacing plausible and code-conscious; exact engineering is confirmed later by the local Gatsby Glass team.',
        '',
        'SELF-CHECK BEFORE OUTPUT:',
        '1. Is the output the same space as input_1 with the same viewpoint, crop and surroundings?',
        '2. Is the new glass railing clearly visible along the correct railing line / edge, and nowhere else?',
        '3. Is exactly ONE system used (continuous base shoe OR individual spigots), with the correct handrail treatment on EVERY glass run (no run missing its rail) and ONE finish on all hardware?',
        '4. For pools: is there an obvious operable gate with no fixed support beneath it, is the water unobstructed, and is there a clear walkway of at least 4 feet between the glass and the coping on every side? If any run hugs the water, redo.',
        '5. Did anything unrelated change (furniture, landscaping, pets, lighting, walls)? If yes, redo.',
        '5b. Is every railing, fence or banister OTHER than the target railing identical to input_1 — same color, finish, material and style? If any was recolored, converted to glass or removed, redo.',
        '5c. Are the deck, stairs and every doorway or stair opening exactly where they were in input_1, with no glass across an opening or over the stairs? Does the railing follow every short jog in the edge and reach all the way to the house or wall? If not, redo.',
        '5d. Stairs: does the stair glass continue to the bottom step with the same mounting as the level runs (a raked base shoe, or two spigots on every stair panel)? If a stair panel is unsupported or the shoe stops at the stairs, redo.',
        '6. SCALE: is the floor mounting tiny next to the glass — base shoe about 2 inches tall (a thin band, not a curb) or spigots about 5 inches tall (small clamps, not posts)? If the mounting is taller than a hand is wide, redo with thinner hardware.',
        '7. Does the render contain any NOT APPROVED element (posts, clamps on posts, cable, pickets, bars, wood, framed glass)? If yes, redo.',
      ],
    },
  ],
  variables: [
    { name: 'mode', type: 'string', required: true, description: 'configure | inspiration' },
    { name: 'setting', type: 'string', required: true, description: 'interior | exterior' },
    { name: 'existing_condition', type: 'string', required: true, default: 'none', description: 'From image validation' },
    { name: 'application', type: 'string', required: true },
    { name: 'application_name', type: 'string', required: true },
    { name: 'application_descriptor', type: 'string', required: true },
    { name: 'railing_system', type: 'string', required: false },
    { name: 'system_name', type: 'string', required: false, default: 'as shown in the inspiration photo' },
    { name: 'system_descriptor', type: 'string', required: false },
    { name: 'handrail', type: 'string', required: false },
    { name: 'handrail_name', type: 'string', required: false, default: 'as shown in the inspiration photo' },
    { name: 'handrail_descriptor', type: 'string', required: false },
    { name: 'finish', type: 'string', required: false },
    { name: 'finish_name', type: 'string', required: false, default: 'as shown in the inspiration photo' },
    { name: 'finish_descriptor', type: 'string', required: false },
  ],
  metadata: {
    ...META,
    tags: ['railing', 'visualization', 'photorealistic'],
    notes:
      'v1.0.0 — Initial railing prompt assembled from the GatsbyView Railing Backend Prompt Logic sheet (B01–B30).',
  },
};

// ---------------------------------------------------------------------------
// SYSTEM TEMPLATE
// ---------------------------------------------------------------------------

export const railingSystemTemplate: PromptTemplate = {
  id: RAILING_SYSTEM_TEMPLATE_ID,
  version: '1.1.0',
  name: 'System Prompt for Gemini (glass railing)',
  type: 'system',
  description: 'System-level instructions for frameless glass railing renders.',
  sections: [
    {
      id: 'role',
      type: 'header',
      content: [
        'You are an AI image generation assistant for Gatsby Glass, a high-end custom glass company.',
        'Your task is to edit a customer\'s photo of a staircase, balcony, loft, deck, patio, porch, or pool area to show a NEW frameless glass railing installed along the existing railing line, guard line, or open edge.',
      ],
    },
    {
      id: 'universal_rules',
      type: 'instructions',
      content: [
        '',
        'UNIVERSAL RULES (apply to every generation, override any conflicting interpretation of the user prompt):',
        '',
        'A. TARGET IDENTITY — the output is input_1\'s space',
        '   1. The output must be the SAME space as input_1: same architecture, flooring, walls, stairs, deck, pool, landscaping, furniture, lighting and camera viewpoint.',
        '   2. NEVER substitute a different space, a stock photo, or the inspiration photo (input_2 if provided) as the output.',
        '   3. Output pixel dimensions and aspect ratio must EXACTLY match input_1.',
        '',
        'B. PRESERVATION — nothing unrelated changes',
        '   1. Preserve every element that is not the railing exactly as shown: structure, trim, floors, walls, ceilings, windows, doors, furniture, planters, pets, hardscape, pool shape and water, signage and lighting.',
        '   2. Do not move, mirror, duplicate, recolor or remove any unrelated object. Do not widen, reshape or relocate an edge, stair or deck to fit the railing.',
        '   3. Only the target railing changes — the one connected railing at the selected application, including all of its runs, returns and stair sides. Every SEPARATE railing, fence, banister or metalwork in input_1 (other levels, neighbors, background, reflections) keeps its exact color, finish, material and style.',
        '',
        'C. REMOVAL — only the existing guard',
        '   1. Remove ONLY an existing railing, guard, fence or guard-height half wall at the railing location when the specification says so. Never remove full-height walls or unrelated structure.',
        '',
        'D. NEW INSTALL — installing the railing is the entire purpose',
        '   1. The output MUST visibly contain the new frameless glass railing. Returning the input unchanged, or an image where no glass or hardware can be seen, is a FAILURE.',
        '   2. Use exactly ONE approved mounting system for all fixed panels (continuous base shoe OR individual spigots), ONE handrail treatment, and ONE hardware finish.',
        '   3. Glass panels are clear, frameless and evenly organized with consistent height and spacing. No cable rail, pickets, posts, framed panels or wood.',
        '   4. Pool renders always include one operable gate with no fixed support beneath it.',
        '',
        'E. PHOTOREALISM',
        '   1. Match input_1\'s lighting direction, color temperature, intensity, shadows, reflections, perspective and lens.',
        '   2. The result must be indistinguishable from a professional installation photo of input_1.',
        '',
        'F. FOLLOWING THE SPECIFICATION',
        '   1. The user prompt provides a <RAILING_SPECIFICATION> and ordered rules. Treat them as the source of truth. Run the SELF-CHECK before producing the image.',
      ],
    },
  ],
  variables: [],
  metadata: { ...META, tags: ['railing', 'system', 'gemini'], notes: 'v1.1.0 — Target-railing-only preservation (HP-2803).' },
};

// ---------------------------------------------------------------------------
// VALIDATION TEMPLATE
// ---------------------------------------------------------------------------

export const railingValidationTemplate: PromptTemplate = {
  id: RAILING_VALIDATION_TEMPLATE_ID,
  version: '1.0.0',
  name: 'Railing Image Validation Prompt',
  type: 'validation',
  description:
    'Validates that an uploaded photo shows a space where a glass railing could be installed, and detects the setting and existing guard condition.',
  sections: [
    {
      id: 'task',
      type: 'header',
      content: [
        'Analyze this image to determine if it shows a space where a glass railing, guard, or pool fence could be installed.',
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
        '- An interior staircase, stair landing, loft, mezzanine, or balcony edge (with or without an existing railing or half wall)',
        '- An exterior deck, patio, porch, terrace, rooftop, or raised walkway edge (with or without an existing railing)',
        '- A swimming pool area, pool deck, or spa surround (with or without an existing fence)',
        '- Any open edge, drop-off, or guard line where a railing would normally go',
        '- An existing wood, metal, cable, glass, or composite railing or fence',
        '- A product, showroom, or catalog photo of a glass railing, balustrade, or pool fence (used as an inspiration photo)',
        '',
        'REJECT (isValid: false) ONLY if the image is clearly:',
        '- A bathroom, shower, or tub',
        '- A single room with no visible edge, stair, balcony, deck, or pool (e.g. a plain bedroom wall)',
        '- A document, screenshot, drawing, or text',
        '- Completely unrelated to a home or property',
      ],
    },
    {
      id: 'detection',
      type: 'specifications',
      content: [
        '',
        'DETECTION (if valid):',
        'setting:',
        "- 'interior': inside a building (stairs, loft, balcony, landing)",
        "- 'exterior': outdoors (deck, patio, porch, rooftop, pool area)",
        'existingCondition — what currently occupies the railing location:',
        "- 'existing_railing': a wood, metal, cable, composite, or glass railing / guard is present along the edge or stair",
        "- 'half_wall': a guard-height half wall / pony wall / knee wall acts as the guard (common on interior stairs)",
        "- 'existing_fence': a pool or yard fence / barrier is present around the area",
        "- 'open_edge': a clear open edge, drop-off, or stair with NO barrier at all",
        "- 'none': cannot tell",
        'detectedApplication — which railing application the photo best fits:',
        "- 'interior_staircase': an indoor staircase or stair run is the main subject (the guard follows the stair slope)",
        "- 'interior_balcony': an indoor loft, landing, mezzanine, or balcony edge overlooking a space below (level guard)",
        "- 'exterior_deck': an outdoor deck, patio, porch, terrace, rooftop, or walkway edge",
        "- 'pool_balustrade': a swimming pool or spa area where a pool fence / balustrade would go",
        "- 'unknown': cannot tell",
        'If the photo shows both an interior stair and a landing / balcony, prefer interior_staircase.',
      ],
    },
    {
      id: 'response_format',
      type: 'custom',
      content: [
        '',
        'RESPONSE:',
        'Return JSON with isValid (boolean), reason (string, only if invalid), contentFlag (string), setting (string), existingCondition (string), and detectedApplication (string).',
        '',
        'When in doubt, ACCEPT the image as valid.',
      ],
    },
  ],
  variables: [],
  metadata: { ...META, tags: ['railing', 'validation', 'image-analysis'], notes: 'v1.0.0 — Initial railing validation prompt.' },
};

// ---------------------------------------------------------------------------
// EXPORT MAP (merged into the brand template map by lib/registerTemplates.ts)
// ---------------------------------------------------------------------------

export const railingTemplates: Record<string, PromptTemplate> = {
  [RAILING_VISUALIZATION_TEMPLATE_ID]: railingVisualizationTemplate,
  [RAILING_SYSTEM_TEMPLATE_ID]: railingSystemTemplate,
  [RAILING_VALIDATION_TEMPLATE_ID]: railingValidationTemplate,
};
