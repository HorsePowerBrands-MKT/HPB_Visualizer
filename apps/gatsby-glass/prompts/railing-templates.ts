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

export const RAILING_VISUALIZATION_TEMPLATE_ID = 'railing-visualization-v1';
export const RAILING_SYSTEM_TEMPLATE_ID = 'railing-system-v1';
export const RAILING_VALIDATION_TEMPLATE_ID = 'railing-validation-v1';

const META = {
  createdAt: '2026-10-12T00:00:00.000Z',
  updatedAt: '2026-10-12T00:00:00.000Z',
  author: 'Gatsby Glass Team',
};

// ---------------------------------------------------------------------------
// VISUALIZATION TEMPLATE (both consumer paths)
// ---------------------------------------------------------------------------

export const railingVisualizationTemplate: PromptTemplate = {
  id: RAILING_VISUALIZATION_TEMPLATE_ID,
  version: '1.0.0',
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
        '- Preserve the staircase, flooring, walls, windows, doors, ceiling, deck or balcony structure, pool, coping, hardscape, furniture, landscaping, pets, people-free scene, lighting, planters, signage and ALL surrounding elements exactly as shown.',
        '- The only exception is when the selected application specifically requires replacement of an existing guard wall (see placement rules).',
        '- Do not move, remove, add, recolor or redesign unrelated objects or surfaces. Do not alter camera viewpoint, crop, architecture, landscaping, furniture, pool shape, hardscape, pets or lighting to accommodate the railing.',
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
          content: [
            '- An existing railing / guard is visible. REMOVE only the existing railing system and replace it along the SAME railing location, stair slope, landing geometry, balcony edge or deck perimeter. Preserve the supporting architecture. Do not extend the new railing onto adjacent walls or surfaces.',
          ],
        },
        {
          id: 'B10_open_edge',
          type: 'instructions',
          condition: { variable: 'existing_condition', operator: 'in', value: ['open_edge', 'none'] },
          content: [
            '- No existing railing at the edge. ADD the selected glass railing only along the existing open edge or guard line. Use the existing geometry as the placement anchor. Do not reshape, relocate or extend the architectural edge.',
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
          id: 'B13_exterior_deck',
          type: 'instructions',
          condition: { variable: 'application', operator: 'equals', value: 'exterior_deck' },
          content: [
            '- Use the existing deck / patio perimeter and existing railing line as the guide. Replace only the railing. If no railing is present, follow the clearly defined open deck / patio edge rather than inventing a new perimeter.',
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
    // System — B04 / B05 (or from inspiration)
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
            '- Every fixed glass panel sits in ONE continuous low-profile base shoe along the required railing line. If ANY spigots, posts or vertical frames appear in the fixed runs, the render FAILS.',
            '- SIZE: the base shoe is SLIM and LOW. It reads as a thin channel at the floor line, roughly the height of a baseboard, in the selected finish. Do NOT render it as a tall curb, a raised box, a wide plinth or a thick frame. The glass should dominate; the shoe is a detail.',
          ],
        },
        {
          id: 'B05_spigot',
          type: 'hardware_detail',
          condition: { variable: 'railing_system', operator: 'equals', value: 'spigot' },
          content: [
            '- SPIGOT (hard system lock): install {{system_descriptor}}.',
            '- Spigots read as ONE consistent hardware family, two per panel at even spacing, with open space beneath the glass. If a continuous bottom channel, base shoe, posts or vertical framing appear, the render FAILS.',
            '- SIZE: spigots are SMALL and compact — short clamps at the very base of the glass, in the selected finish. Do NOT render tall posts, oversized blocks or bulky brackets. The glass should dominate; the spigots are a detail.',
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
          ],
        },
        { id: 'system_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Handrail — B06 / B07 (or from inspiration)
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
            '- The rail sits ON the top edge of the glass and caps it. Do NOT add any second rail on the glass face, and do NOT leave the glass edge exposed above the rail.',
          ],
        },
        {
          id: 'B06_side_mount',
          type: 'hardware_detail',
          condition: { variable: 'handrail', operator: 'equals', value: 'side_mount' },
          content: [
            '- SIDE-MOUNTED (hard lock): add {{handrail_descriptor}}.',
            '- The rail is on the FACE of the glass on small brackets, slightly below the top edge; the glass edge stays visible above it. Do NOT add a cap rail on top of the glass, and do NOT merge the rail into the glass edge.',
          ],
        },
        {
          id: 'B07_no_handrail',
          type: 'hardware_detail',
          condition: { variable: 'handrail', operator: 'equals', value: 'no_handrail' },
          content: [
            '- HARD NEGATIVE: {{handrail_descriptor}}.',
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
            '- Match the handrail treatment shown in input_2, mapped to exactly one approved treatment: a TOP-MOUNTED cap rail seated on the glass edge, a SIDE-MOUNTED rail on the glass face on small brackets, or NO handrail (clean exposed glass edge). Use one treatment consistently along the whole run.',
          ],
        },
        { id: 'handrail_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Finish — B08 (or from inspiration)
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
          content: [
            '- Apply {{finish_descriptor}} consistently to ALL visible railing hardware: base shoe or spigots, handrail, clamps, connectors and gate hardware. One finish only. This explicit selection overrides any finish shown in an inspiration image.',
          ],
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
            '- Match the hardware finish shown in input_2 (matte black, brushed stainless, or polished stainless) and apply it consistently to ALL visible railing hardware. One finish only.',
          ],
        },
        { id: 'finish_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Pool gate — B16 / B17 / B18 (pool only)
    // -----------------------------------------------------------------
    {
      id: 'pool_gate',
      type: 'instructions',
      condition: { variable: 'application', operator: 'equals', value: 'pool_balustrade' },
      content: [
        'POOL GATE (mandatory for every pool render):',
        '- Include at least one clearly identifiable, functional access gate at a logical pedestrian approach to the pool area. Use appropriate hinges and latch hardware in the selected finish. The gate must read visually as operable and distinct from the fixed glass panels.',
      ],
      children: [
        {
          id: 'B17_gate_base_shoe',
          type: 'instructions',
          condition: { variable: 'railing_system', operator: 'equals', value: 'base_shoe' },
          content: [
            '- Run the continuous base shoe ONLY beneath fixed glass panels. Interrupt the base shoe at the operable gate opening. Do not place a base shoe, spigot or other fixed support directly beneath the gate panel.',
          ],
        },
        {
          id: 'B18_gate_spigot',
          type: 'instructions',
          condition: { variable: 'railing_system', operator: 'equals', value: 'spigot' },
          content: [
            '- Use spigots ONLY beneath fixed glass panels. Do not place a spigot directly beneath the operable gate panel. Use gate-specific hinge / latch hardware at the gate.',
          ],
        },
        {
          id: 'gate_generic_support',
          type: 'instructions',
          condition: { variable: 'railing_system', operator: 'not_exists' },
          content: [
            '- Never place a base shoe, spigot or other fixed support directly beneath the gate panel; the gate hangs on gate-specific hinges with a latch.',
          ],
        },
        { id: 'pool_gate_end', type: 'custom', content: [''] },
      ],
    },

    // -----------------------------------------------------------------
    // Inspiration rules — B20 / B21 / B22
    // -----------------------------------------------------------------
    {
      id: 'inspiration_rules',
      type: 'instructions',
      condition: { variable: 'mode', operator: 'equals', value: 'inspiration' },
      content: [
        'INSPIRATION RULES (B20–B22):',
        '- input_2 controls STYLE only: railing system appearance, glass configuration, handrail treatment, hardware style, and gate treatment where applicable.',
        '- input_1 controls SPACE and GEOMETRY. Do NOT copy the railing path, dimensions, background, landscaping or architecture from input_2. Determine railing placement from input_1 and the placement rules above.',
        '- Precedence: explicit consumer selection > inspiration image > backend defaults. Any selection listed in the RAILING_SPECIFICATION overrides what input_2 shows.',
        '- If input_2 shows a non-approved system (cable rail, picket rail, framed posts, wood), map it to the nearest approved Gatsby Glass configuration instead of copying it.',
        '',
      ],
    },

    // -----------------------------------------------------------------
    // Guardrails — B26 / B27 / B29 + self-check
    // -----------------------------------------------------------------
    {
      id: 'guardrails',
      type: 'instructions',
      content: [
        'RENDER QUALITY (B26 / B27):',
        '- Keep glass panels, joints, spigots, clamps and base-shoe runs visually consistent, evenly organized and realistic for the available geometry. Avoid random support spacing, unnecessary panel breaks or mixed hardware systems.',
        '- Restrict visuals to Gatsby Glass approved system families: Base Shoe or Spigot, with the approved handrail treatment and selected finish. Never invent cable rail, picket rail, framed-post systems, wood rail or any unrelated railing type.',
        '- Glass must be clearly VISIBLE: render edge highlights, subtle reflections and the hardware in the selected finish. A render where the glass cannot be seen is a FAILED render.',
        '- Match input_1\'s lighting direction, color temperature, shadows, perspective and lens. The result must look like a professional installation photo of the SAME space.',
        '- This is a design visualization, not an engineered or code-approved drawing. Keep heights and spacing plausible and code-conscious; exact engineering is confirmed later by the local Gatsby Glass team.',
        '',
        'SELF-CHECK BEFORE OUTPUT:',
        '1. Is the output the same space as input_1 with the same viewpoint, crop and surroundings?',
        '2. Is the new glass railing clearly visible along the correct railing line / edge, and nowhere else?',
        '3. Is exactly ONE system used (continuous base shoe OR individual spigots), with the correct handrail treatment and ONE finish on all hardware?',
        '4. For pools: is there an obvious operable gate with no fixed support beneath it, and is the water unobstructed?',
        '5. Did anything unrelated change (furniture, landscaping, pets, lighting, walls)? If yes, redo.',
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
  version: '1.0.0',
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
  metadata: { ...META, tags: ['railing', 'system', 'gemini'], notes: 'v1.0.0 — Initial railing system prompt.' },
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
