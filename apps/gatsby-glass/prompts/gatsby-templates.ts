/**
 * Gatsby Glass Prompt Templates (TypeScript objects)
 *
 * These are the brand-specific prompt templates used by the template processor.
 * Each section is rendered in order; sections with conditions are only emitted
 * when the condition matches the current configuration.
 *
 * The visualization template emits a fully-resolved <INSTALL_SPECIFICATION>
 * JSON-style block with explicit preserve_exact / remove / forbidden_elements
 * / self_check_before_output arrays. Each forbidden / self-check item is
 * derived directly from the 51 reported issues so the model has concrete
 * negative examples to anchor against.
 *
 * To roll back to the previous templates, change the IDs in `gatsbyGlassRegistry.activeTemplates`.
 */

import type { PromptTemplate, PromptTemplateRegistry } from '@repo/prompt-templates';

// ---------------------------------------------------------------------------
// VISUALIZATION TEMPLATE (configure mode)
// ---------------------------------------------------------------------------

export const visualizationTemplate: PromptTemplate = {
  id: "visualization-v3",
  version: "3.0.0",
  name: "Shower Visualization Prompt (JSON spec)",
  type: "visualization",
  description: "Structured JSON-payload prompt for photorealistic shower glass visualizations. Built from the 51 reported issue clusters.",
  sections: [
    // ---------------------------------------------------------------
    // 1. Prose intro + critical universal rules
    // ---------------------------------------------------------------
    {
      id: "intro",
      type: "header",
      content: [
        "You are editing a target bathroom photo (input_1) to install a NEW shower glass enclosure.",
        "The output must be the SAME bathroom as input_1 — never a different room, never the inspiration photo.",
        "",
        "CRITICAL UNIVERSAL RULES (apply to every generation):",
        "0. INSTALLATION IS MANDATORY. The output MUST visibly contain the new shower enclosure described below. The most common failure mode is returning the input image unchanged because there was nothing obvious to remove — DO NOT do this. If the input already shows an open shower alcove with no curtain or door, you must HALLUCINATE the new enclosure into the scene from scratch. An output that looks identical to the input is a FAILED generation.",
        "1. PRESERVE the target bathroom's identity exactly: walls, tile, floor, ceiling, lighting, fixtures, decor.",
        "2. NEVER duplicate, mirror, or relocate any fixture. Shower head, valve, faucet, plumbing, toilet, vanity, niches stay in their EXACT original positions and on their EXACT original walls.",
        "3. REMOVE entirely from the output: any existing shower glass, shower door, shower curtain (cloth or vinyl), shower curtain rod, curtain hooks, and curtain rings. Do NOT recolor or repaint the curtain rod to match new hardware — REMOVE IT. (If the input had none of these, there is nothing to remove — proceed directly to installing the new enclosure.)",
        "4. The new enclosure MUST span the full WALL-TO-WALL shower entrance, regardless of how wide any existing curtain or partial door was. Do not match the width of any prior partial installation.",
        "5. UNIFORMITY: every piece of hardware uses ONE finish; every glass panel uses ONE glass style; every door panel uses the SAME identical handle (style + size + position).",
        "6. Output pixel dimensions must match the input image exactly.",
        "7. If a shower curtain in the input image is partially open, infer fixture sides ONLY from visible plumbing penetrations or wall protrusions — do NOT assume left/right symmetry and do NOT mirror fixtures to the hidden side.",
        "8. If the input image has no inspiration photo attached, IGNORE any imaginary 'reference' — work only from input_1.",
        "9. VISIBILITY: the new enclosure MUST be visibly present in the output. At a minimum, you must be able to point to glass panel edges, the required hardware (frame / hinges / pivot fittings / track + rollers), and the door handle. Frameless + clear glass is the easiest combo to accidentally make invisible — for that combo you MUST render bright edge highlights, visible top/bottom pivot or hinge hardware, and a clearly visible through-glass handle.",
        "",
        "Use the following structured specification as the source of truth for what to install:",
        "",
      ],
    },

    // ---------------------------------------------------------------
    // 2. <INSTALL_SPECIFICATION> opening — subject, scene, install header
    // ---------------------------------------------------------------
    {
      id: "spec_open",
      type: "specifications",
      content: [
        "<INSTALL_SPECIFICATION>",
        "{",
        "  \"task\": \"edit_in_place_install_new_shower_enclosure\",",
        "  \"must_install\": {",
        "    \"mandate\": \"The output MUST visibly contain the new shower enclosure described in this specification. Returning input_1 unchanged (or an output that looks effectively identical to input_1) is a FAILED generation.\",",
        "    \"open_alcove_handling\": \"If input_1 shows an open shower alcove with no existing door, glass, or curtain, you MUST hallucinate the new enclosure into the scene from scratch. The absence of an existing enclosure does NOT mean the output should also have none.\",",
        "    \"existing_enclosure_handling\": \"If input_1 has an existing curtain, door, or glass, you MUST both REMOVE it AND install the new enclosure. Removal alone is a FAILURE.\",",
        "    \"forbidden_output\": [",
        "      \"output identical or near-identical to input_1\",",
        "      \"output with no glass panel visible anywhere in the shower opening\",",
        "      \"output with no hardware visible (no hinges / pivots / track / frame / handle)\",",
        "      \"output where the shower remains an open alcove\"",
        "    ]",
        "  },",
        "  \"subject\": {",
        "    \"shower_type\": \"{{shower_shape}}\",",
        "    \"source_image\": \"input_1_target_bathroom\"",
        "  },",
        "  \"scene_preservation\": {",
        "    \"lighting\": \"match input_1 exactly — direction, color temperature, intensity, shadows\",",
        "    \"perspective\": \"match input_1 camera angle and lens exactly\",",
        "    \"output_dimensions\": \"match input_1 pixel dimensions exactly\",",
        "    \"color_grading\": \"match input_1 bathroom palette and white balance\"",
        "  },",
        "  \"install\": {",
        "    \"enclosure_type\": \"{{enclosure_type_name}}\",",
        "    \"framing\": \"{{track_preference_name}}\",",
        "    \"glass_style\": \"{{glass_style_name}}\",",
        "    \"hardware_finish\": \"{{hardware_finish_name}}\",",
        "    \"handle\": {",
        "      \"style\": \"{{handle_style_name}}\",",
        "      \"count_rule\": \"EXACTLY ONE handle per door panel; the SAME handle on every panel; mounted on the side of the door OPPOSITE the operating mechanism (opposite the hinges for a hinged door; opposite the offset pivot axis for a pivot door; on the outer edge of the moving panel for a sliding door)\",",
        "      \"forbidden_substitutes\": [\"wall-mounted towel bar\", \"second knob in place of pull\", \"different style on second panel\", \"different sizes on different panels\"]",
        "    },",
        "    \"dimensions\": {",
        "      \"span\": \"wall_to_wall — covers the full shower entrance from one wall edge to the other\",",
      ],
    },

    // ---------------------------------------------------------------
    // 3. dimensions.height (only meaningful for hinged/pivot; sliding always full-width track)
    // ---------------------------------------------------------------
    {
      id: "spec_height_hinged",
      type: "specifications",
      condition: { variable: "enclosure_type", operator: "equals", value: "hinged" },
      content: [
        "      \"height\": \"{{hinged_height}}\"",
        "    },",
      ],
    },
    {
      id: "spec_height_pivot",
      type: "specifications",
      condition: { variable: "enclosure_type", operator: "equals", value: "pivot" },
      content: [
        "      \"height\": \"standard pivot door height — glass panel sized to fully close the entrance, with header bar or top pivot mount\"",
        "    },",
      ],
    },
    {
      id: "spec_height_sliding",
      type: "specifications",
      condition: { variable: "enclosure_type", operator: "equals", value: "sliding" },
      content: [
        "      \"height\": \"standard sliding door height — track spans the full opening width with panels reaching from track down to tub deck or shower curb\"",
        "    },",
      ],
    },

    // ---------------------------------------------------------------
    // 4. configuration block (per enclosure type)
    // ---------------------------------------------------------------
    {
      id: "config_hinged",
      type: "configuration",
      condition: { variable: "enclosure_type", operator: "equals", value: "hinged" },
      content: [
        "    \"configuration\": {",
        "      \"type\": \"hinged\",",
        "      \"swing_direction\": \"{{hinged_direction}}\",",
        "      \"door_state\": \"FULLY CLOSED — the door is flush against the adjacent fixed panel or wall, NOT swung open. The door type is identifiable from the hardware (side-mounted hinges along the correct edge) without needing to tilt the door open.\",",
        "      \"door_count\": \"{{hinged_count}}\",",
        "      \"is_double\": {{hinged_is_double}},",
        "      \"hinge_axis\": \"{{hinged_hinge_axis}}\",",
        "      \"handle_position\": \"{{hinged_handle_position}}\"",
        "    }",
        "  },",
      ],
    },
    {
      id: "config_pivot",
      type: "configuration",
      condition: { variable: "enclosure_type", operator: "equals", value: "pivot" },
      content: [
        "    \"configuration\": {",
        "      \"type\": \"pivot\",",
        "      \"common_mistake_warning\": \"PIVOT DOORS ARE COMMONLY MIS-RENDERED AS HINGED DOORS. This is the #1 failure mode for pivot installs. A pivot door has NO side-mounted hinges. The pivot mechanism lives on the TOP and BOTTOM horizontal edges of the door (one small fitting at the top, one at the bottom, both on the same vertical axis), NOT along either vertical (left or right) edge. If you render side hinges anywhere along a vertical edge of this door, you have rendered the WRONG door type.\",",
        "      \"visual_reference\": \"A pivot shower door appears to FLOAT in space. Its vertical (left and right) edges are completely bare — no hinges, no clamps, no brackets, nothing. The ONLY visible hardware is (a) a small pivot fitting at the TOP horizontal edge of the door connecting to a header bar or ceiling-mounted bracket, and (b) a matching small pivot pin embedded in the FLOOR or curb directly below the top fitting. Both pivot points sit on the same vertical axis, offset 4-6 inches IN from one vertical edge of the door (NOT centered, NOT on the edge). The door rotates around this offset top-to-bottom axis.\",",
        "      \"reference_images\": {",
        "        \"availability\": \"An AUTHORITATIVE pivot anatomy reference image is attached to this request AFTER input_1 (and AFTER input_2 if an inspiration photo is provided). For double-pivot configurations TWO reference images are attached, one per door. These reference images are the FINAL image input(s) before this text prompt.\",",
        "        \"purpose\": \"Use the reference image(s) ONLY as ground-truth examples of pivot-door anatomy: hardware placement (small pivot fittings on the TOP and BOTTOM horizontal edges of the door, both on the same vertical axis), the BARE vertical edges of the door (no hinges/clamps/brackets along the left or right edges), the handle position OPPOSITE the pivot axis, and the proportions of the adjacent fixed return panel.\",",
        "        \"direction_mapping\": \"For a SINGLE pivot door, the attached reference shows the EXACT direction requested in swing_direction above — match the side the pivot axis is on (left or right) and the side the handle is on (opposite). For a DOUBLE pivot, both references are attached so you can see both wall-side configurations meeting in the center.\",",
        "        \"do_not_copy\": [",
        "          \"the reference's plain white/blank background — render the door into input_1's actual bathroom\",",
        "          \"the reference's lighting, color palette, or photographic style — match input_1's lighting and color grading exactly\",",
        "          \"the reference's overall scene framing — input_1 is the ONLY scene to render into\",",
        "          \"the reference's exact framing style (the reference shows semi-framed/chrome geometry; if the requested framing is frameless or fully framed, follow the framing-specific hardware_layout below, but keep the pivot-mechanism placement from the reference)\",",
        "          \"the reference's specific handle shape — use the requested handle_style ({{handle_style_name}}) on the same side the reference's handle is on\"",
        "        ],",
        "        \"copy_only\": [",
        "          \"the position of the TOP pivot fitting (top horizontal edge of door, offset toward the pivot-axis side)\",",
        "          \"the position of the BOTTOM pivot fitting (bottom horizontal edge of door, directly below the top fitting)\",",
        "          \"the fact that the vertical edges of the door are BARE\",",
        "          \"the side the handle is on relative to the pivot axis (opposite)\",",
        "          \"the presence of an adjacent fixed return panel of similar height\"",
        "        ],",
        "        \"override_warning\": \"If the reference image disagrees with your default 'shower door' rendering instinct, TRUST THE REFERENCE. The reference is the ground truth for what a pivot door looks like — your default rendering is the failure mode this reference is here to correct.\"",
        "      },",
        "      \"swing_direction\": \"{{pivot_direction}}\",",
        "      \"door_state\": \"FULLY CLOSED — the door is flush against the adjacent fixed panel or wall, NOT swung open. The pivot type is identifiable from the offset pivot hardware visible at TOP and BOTTOM without needing to tilt the door open.\",",
        "      \"door_count\": \"{{pivot_count}}\",",
        "      \"is_double\": {{pivot_is_double}},",
        "      \"pivot_axis\": \"{{pivot_axis}}\",",
        "      \"vertical_edges\": \"BOTH vertical (left and right) edges of the pivot door are COMPLETELY BARE. No hinges. No brackets. No clamps. No hardware whatsoever along the vertical edges. If a viewer can see hardware along the left or right edge of the door, the render is WRONG.\",",
        "      \"handle_position\": \"{{pivot_handle_position}}\",",
        "      \"spatial_map\": {",
        "        \"_purpose\": \"Region-by-region map of WHERE every part of the pivot door is, and just as importantly WHERE NOTHING is. The model MUST conform to this map. Pair it with the AUTHORITATIVE PIVOT-DOOR REFERENCE IMAGE shown earlier in this multimodal input — the reference image is the visual ground truth, this spatial_map is the textual ground truth, and they describe the same anatomy.\",",
        "        \"top_horizontal_edge_of_door\": \"{{pivot_top_fitting_location}}\",",
        "        \"bottom_horizontal_edge_of_door\": \"{{pivot_bottom_fitting_location}}\",",
        "        \"left_vertical_edge_of_door\": \"{{pivot_left_edge_layout}}\",",
        "        \"right_vertical_edge_of_door\": \"{{pivot_right_edge_layout}}\",",
        "        \"door_interior_glass_field\": \"The central region of the door (everywhere except the top edge, bottom edge, vertical edges, and the handle) is just clean flat glass — no decorative elements, no etching, no logos, no extra hardware, no through-glass fittings except the single handle described below.\",",
        "        \"handle_location_on_door\": \"{{pivot_handle_exact_position}}\",",
        "        \"fixed_return_panel_location\": \"{{pivot_fixed_panel_position}}\",",
        "        \"four_corners_of_door\": {",
        "          \"top_left\": \"{{pivot_corner_tl}}\",",
        "          \"top_right\": \"{{pivot_corner_tr}}\",",
        "          \"bottom_left\": \"{{pivot_corner_bl}}\",",
        "          \"bottom_right\": \"{{pivot_corner_br}}\"",
        "        },",
        "        \"axis_of_rotation\": \"The vertical line connecting the top pivot fitting and the bottom pivot pin IS the door's pivot axis. The door rotates around this offset top-to-bottom line — NOT around any vertical edge, NOT around the center, NOT around side hinges. Even with the door FULLY CLOSED (as required), the offset position of the top and bottom fittings makes the pivot anatomy unambiguous.\",",
        "        \"summary_things_NOT_present\": [",
        "          \"NO side hinges anywhere — not on the left vertical edge, not on the right vertical edge, not at any corner\",",
        "          \"NO hinge plates, NO glass clamps, NO mounting brackets on either vertical edge of the door\",",
        "          \"NO continuous top track or header rail spanning the door (frameless variant) — just the single small top fitting\",",
        "          \"NO continuous bottom track or U-channel along the bottom edge of the door — just the single small floor pin\",",
        "          \"NO hardware at any of the door's four corners — all four corners are bare exposed glass\",",
        "          \"NO sliding rollers or wheel carriages — this is a PIVOT door, not a sliding door\",",
        "          \"NO second handle, NO knob, NO escutcheon, NO latch hardware on the door beyond the single through-glass handle described above\"",
        "        ]",
        "      }",
        "    }",
        "  },",
      ],
    },
    {
      id: "config_sliding",
      type: "configuration",
      condition: { variable: "enclosure_type", operator: "equals", value: "sliding" },
      content: [
        "    \"configuration\": {",
        "      \"type\": \"sliding\",",
        "      \"variant\": \"{{sliding_type}}\",",
        "      \"slide_direction\": \"{{sliding_direction}}\",",
        "      \"door_state\": \"FULLY CLOSED — both panels visible meeting at a clean vertical seam in the middle\",",
        "      \"panel_count\": \"{{sliding_count}}\",",
        "      \"is_double\": {{sliding_is_double}},",
        "      \"motion\": \"horizontal slide on a top-mounted track — NEVER swing, NEVER pivot\",",
        "      \"handle_position\": \"on the OUTER edges of each panel only — NEVER at the center seam where panels meet\"",
        "    }",
        "  },",
      ],
    },

    // ---------------------------------------------------------------
    // 5a. visibility_requirements — the new enclosure MUST be visibly present
    //     in the output. Critical for catching no-op renders, especially in
    //     the frameless + clear glass combination where the enclosure is
    //     easiest for the AI to accidentally make invisible.
    // ---------------------------------------------------------------
    {
      id: "visibility_requirements",
      type: "specifications",
      content: [
        "  \"visibility_requirements\": {",
        "    \"must_be_visible_in_output\": [",
        "      \"the glass panel(s) of the new enclosure — at minimum visible via edge highlights, surface reflections of the bathroom lighting, and the slight color/refraction shift through the glass\",",
        "      \"the door handle in {{handle_style_name}} {{hardware_finish_name}}, clearly mounted on the door\",",
        "      \"the door-type-appropriate hardware (hinges OR pivot fittings OR top track + rollers) in {{hardware_finish_name}}\"",
        "    ],",
        "    \"no_op_check\": \"Before output, compare the planned render to input_1. If a viewer could mistake the output for the unchanged input image (no visible glass, no visible hardware, no visible handle), the generation has failed — re-render with the enclosure clearly present.\",",
        "    \"clear_glass_visibility_hint\": \"Clear glass is transparent but NOT invisible — render the glass panel with bright specular highlights along all edges, soft reflections of the bathroom lighting on its surface, and a faint refraction/tint of the wall tile seen through it. The viewer must be able to see WHERE the glass is.\"",
        "  },",
      ],
    },
    {
      id: "visibility_frameless_emphasis",
      type: "specifications",
      condition: { variable: "track_preference", operator: "equals", value: "frameless" },
      content: [
        "  \"frameless_visibility_note\": \"This install is FRAMELESS, which means there is no frame to outline the glass. The only visible cues will be: (1) bright specular edge highlights along every glass edge, (2) the small pieces of hardware appropriate to the door type, and (3) the through-glass handle. Without these three signals the enclosure will appear absent. Render all three prominently.\",",
      ],
    },
    // ---------------------------------------------------------------
    // 4b. anatomy_reference_pointer — only for pivot installs, where the
    //     route attaches one or more authoritative pivot-door reference
    //     photographs earlier in the multimodal `parts` array. This block
    //     reminds the model that those references exist and tells it to
    //     match the pivot anatomy shown in them. The references' own
    //     introductory text (set in apps/gatsby-glass/lib/referenceImages.ts)
    //     already tells the model what to copy and what to ignore — this
    //     section just reinforces the link.
    // ---------------------------------------------------------------
    {
      id: "anatomy_reference_pointer_pivot",
      type: "specifications",
      condition: { variable: "enclosure_type", operator: "equals", value: "pivot" },
      content: [
        "  \"anatomy_reference\": {",
        "    \"note\": \"You have been shown one or more AUTHORITATIVE PIVOT-DOOR REFERENCE IMAGES earlier in this multimodal input. Treat those references as your VISUAL GROUND TRUTH for pivot-door anatomy: small pivot fittings at the TOP and BOTTOM horizontal edges of the door, completely BARE vertical edges, single fixed return panel adjacent to the operating door, and the handle on the side opposite the pivot axis. Match this anatomy in your output.\",",
        "    \"what_to_copy_from_reference\": [",
        "      \"the placement of pivot hardware on the TOP and BOTTOM horizontal edges only\",",
        "      \"the completely bare LEFT and RIGHT vertical edges of the door (no hinges, no clamps, no brackets)\",",
        "      \"the relationship between the operating door and its adjacent fixed return panel\",",
        "      \"the orientation of the door consistent with the requested swing direction\"",
        "    ],",
        "    \"what_NOT_to_copy_from_reference\": [",
        "      \"the white background — the output background must be input_1's bathroom\",",
        "      \"any text labels in the reference image (e.g., 'Left open', 'Right open')\",",
        "      \"the chrome/silver finish in the reference — use the {{hardware_finish_name}} finish specified above\",",
        "      \"the exact handle style in the reference — use the {{handle_style_name}} style specified above\",",
        "      \"any wall, floor, tile, lighting, or scene element from the reference — those all come from input_1\"",
        "    ]",
        "  },",
      ],
    },

    // ---------------------------------------------------------------
    // 5. hardware_layout — open
    // ---------------------------------------------------------------
    {
      id: "hw_open",
      type: "hardware_specifications",
      content: [
        "  \"hardware_layout\": [",
      ],
    },

    // ---------------------------------------------------------------
    // 6. hardware_layout — 9 conditional sections, one per (enclosure × framing)
    // ---------------------------------------------------------------
    {
      id: "hw_hinged_frameless",
      type: "hardware_detail",
      condition: {
        operator: "and",
        conditions: [
          { variable: "enclosure_type", operator: "equals", value: "hinged" },
          { variable: "track_preference", operator: "equals", value: "frameless" },
        ],
      },
      content: [
        "    \"Glass: 3/8 to 1/2 inch tempered, ALL edges flat and smooth (NOT beveled, NOT decorative)\",",
        "    \"Hinges: 2 to 3 heavy-duty wall-mounted hinges in {{hardware_finish_name}}, on ONE vertical edge ONLY\",",
        "    \"Hinge plates: rectangular metal plates roughly 2 by 4 inch with visible screw holes on the wall side\",",
        "    \"Glass-clamp mechanism on the door side of each hinge\",",
        "    \"Handle: single {{handle_style_name}} mounted through-glass on the door, on the OPPOSITE edge from the hinges\",",
        "    \"Closing edge: small magnetic strip; bottom edge: clear vinyl sweep\",",
        "    \"NO frame, NO U-channel, NO metal edging anywhere — pure glass with only hinge hardware and the through-glass handle\"",
      ],
    },
    {
      id: "hw_hinged_semi",
      type: "hardware_detail",
      condition: {
        operator: "and",
        conditions: [
          { variable: "enclosure_type", operator: "equals", value: "hinged" },
          { variable: "track_preference", operator: "equals", value: "semi_frameless" },
        ],
      },
      content: [
        "    \"Fixed panels: thin U-channel aluminum edging in {{hardware_finish_name}} (1 to 1.5 inch wide) along walls and base of FIXED panels only\",",
        "    \"Swinging door: FRAMELESS — exposed flat glass edges, no perimeter frame\",",
        "    \"Hinges: mount to wall or to the metal channel of an adjacent fixed panel, on ONE vertical edge only\",",
        "    \"Door bottom: drip rail or sweep, but NO full bottom frame on the door\",",
        "    \"Handle: single {{handle_style_name}} mounted through-glass on the door, opposite the hinge edge\"",
      ],
    },
    {
      id: "hw_hinged_framed",
      type: "hardware_detail",
      condition: {
        operator: "and",
        conditions: [
          { variable: "enclosure_type", operator: "equals", value: "hinged" },
          { variable: "track_preference", operator: "equals", value: "framed" },
        ],
      },
      content: [
        "    \"Frame: continuous extruded aluminum in {{hardware_finish_name}}, 1.5 to 2 inch wide, surrounding ALL four edges of every glass piece including the door\",",
        "    \"Frame corners: visible 45-degree mitered joints\",",
        "    \"Glass: 1/4 inch tempered, edges hidden inside frame channels — NO exposed glass edges anywhere\",",
        "    \"Hinges: traditional barrel or butt hinges, frame-to-frame mount (NOT glass-to-glass)\",",
        "    \"Handle: single {{handle_style_name}} mounted to the frame, opposite the hinge edge\",",
        "    \"Seals: magnetic strip or compression seal inside frame channels\"",
      ],
    },
    {
      id: "hw_pivot_frameless",
      type: "hardware_detail",
      condition: {
        operator: "and",
        conditions: [
          { variable: "enclosure_type", operator: "equals", value: "pivot" },
          { variable: "track_preference", operator: "equals", value: "frameless" },
        ],
      },
      content: [
        "    \"Glass: 3/8 to 1/2 inch tempered with ALL edges flat and smooth (NOT beveled)\",",
        "    \"TOP pivot fitting: a small {{hardware_finish_name}} fitting (~2 by 2 inch footprint) mounted on the TOP HORIZONTAL EDGE of the door, positioned 4-6 inches IN from one vertical edge. It connects upward to a wall-mounted or ceiling-mounted pivot bracket. THIS IS THE ONLY HARDWARE AT THE TOP OF THE DOOR.\",",
        "    \"BOTTOM pivot fitting: a matching small {{hardware_finish_name}} pivot pin embedded in the FLOOR (or shower curb) directly BELOW the top fitting, also 4-6 inches IN from the same vertical edge. It sits in a small stainless cup/plate. THIS IS THE ONLY HARDWARE AT THE BOTTOM OF THE DOOR.\",",
        "    \"TWO pivot points TOTAL — ONE at the TOP horizontal edge, ONE at the BOTTOM horizontal edge, BOTH on the same vertical axis. The door rotates around this top-to-bottom axis like a saloon door.\",",
        "    \"VERTICAL EDGES OF THE DOOR ARE BARE: ZERO hinges, ZERO clamps, ZERO brackets, ZERO hardware along EITHER vertical edge of the door. The left and right edges of the door panel show only flat, smooth, exposed glass. If a viewer sees ANY metal hardware along a vertical edge, the render is WRONG and must be redone.\",",
        "    \"Handle: single {{handle_style_name}} through-glass, mounted on the side of the door OPPOSITE the offset pivot axis\",",
        "    \"NO frame, NO U-channel, NO bottom track, NO metal edging, NO side hinges — pure floating glass with hardware ONLY at the top and bottom horizontal edges plus the handle\"",
      ],
    },
    {
      id: "hw_pivot_semi",
      type: "hardware_detail",
      condition: {
        operator: "and",
        conditions: [
          { variable: "enclosure_type", operator: "equals", value: "pivot" },
          { variable: "track_preference", operator: "equals", value: "semi_frameless" },
        ],
      },
      content: [
        "    \"Fixed panels: thin U-channel aluminum in {{hardware_finish_name}} along walls and base, FIXED PANELS ONLY (not the pivot door)\",",
        "    \"Pivot door: FRAMELESS — flat exposed glass edges on all four sides of the door panel, no perimeter frame on the door\",",
        "    \"TOP pivot mount: a narrow {{hardware_finish_name}} header bar (1 to 1.5 inch tall) spans the FULL opening at the top of the enclosure; the door's TOP HORIZONTAL EDGE attaches to this header via a small pivot fitting positioned 4-6 inches IN from one vertical edge of the door\",",
        "    \"BOTTOM pivot mount: a small {{hardware_finish_name}} floor plate at the bottom of the door, directly BELOW the top pivot fitting, also 4-6 inches IN from the same vertical edge\",",
        "    \"VERTICAL EDGES OF THE DOOR ARE BARE: no hinges, no clamps, no brackets along the door's left or right edges. The door's vertical edges show only flat exposed glass.\",",
        "    \"Handle: single {{handle_style_name}} through-glass on the door, on the side OPPOSITE the offset pivot axis\"",
      ],
    },
    {
      id: "hw_pivot_framed",
      type: "hardware_detail",
      condition: {
        operator: "and",
        conditions: [
          { variable: "enclosure_type", operator: "equals", value: "pivot" },
          { variable: "track_preference", operator: "equals", value: "framed" },
        ],
      },
      content: [
        "    \"Frame: full extruded aluminum frame in {{hardware_finish_name}} around ALL FOUR edges of the pivot door and any fixed panels (1.5 to 2 inch wide profiles)\",",
        "    \"Pivot mechanism: CONCEALED INSIDE the TOP and BOTTOM frame rails of the door — the pivot mechanism is fully integrated into the top and bottom rails, NEVER visible as external hardware along the vertical edges\",",
        "    \"NO side hinges anywhere — even though the door has a full frame, the LEFT and RIGHT vertical frame rails carry NO hinges, NO brackets. The pivot mechanism is at the TOP rail and the BOTTOM rail only.\",",
        "    \"Glass: 1/4 inch tempered, edges hidden in frame channels\",",
        "    \"Frame corners: 45-degree mitered joints\",",
        "    \"Handle: single {{handle_style_name}} mounted to the door's frame, on the side OPPOSITE the offset pivot axis\",",
        "    \"NO externally visible pivot points — clean framed appearance, but the door still rotates around a vertical pivot axis hidden inside the top and bottom rails\"",
      ],
    },
    {
      id: "hw_sliding_frameless",
      type: "hardware_detail",
      condition: {
        operator: "and",
        conditions: [
          { variable: "enclosure_type", operator: "equals", value: "sliding" },
          { variable: "track_preference", operator: "equals", value: "frameless" },
        ],
      },
      content: [
        "    \"Track: single horizontal top-mounted bar in {{hardware_finish_name}}, 1 to 1.5 inch diameter, mounted via visible wall brackets at each end — spans the FULL wall-to-wall opening\",",
        "    \"Rollers: exposed circular wheel carriages on top of each panel ({{sliding_count}}) — TWO carriages per panel, NEVER three sets\",",
        "    \"Glass: 3/8 inch tempered with all edges flat and smooth\",",
        "    \"NO bottom track — only a small floor guide pin per panel to prevent swing\",",
        "    \"Handles: one {{handle_style_name}} on the OUTER edge of each panel only, mounted through-glass — NEVER at the center seam\",",
        "    \"Closed state: panels meet with a clean vertical seam in the middle (or bypass cleanly)\",",
        "    \"NO U-channel along walls, NO three-sided frame, NO bottom rail, NO frame around any panel\"",
      ],
    },
    {
      id: "hw_sliding_semi",
      type: "hardware_detail",
      condition: {
        operator: "and",
        conditions: [
          { variable: "enclosure_type", operator: "equals", value: "sliding" },
          { variable: "track_preference", operator: "equals", value: "semi_frameless" },
        ],
      },
      content: [
        "    \"Fixed panels: thin U-channel aluminum in {{hardware_finish_name}} along walls and base of fixed panels\",",
        "    \"Sliding panels: FRAMELESS, exposed flat glass edges, NO perimeter frame\",",
        "    \"Track: metal header in {{hardware_finish_name}} with a partially recessed channel at top — rollers mostly hidden\",",
        "    \"Bottom: small bottom rail or curb channel guides the sliding panels\",",
        "    \"Handles: through-glass {{handle_style_name}} on outer edges of sliding panels only\"",
      ],
    },
    {
      id: "hw_sliding_framed",
      type: "hardware_detail",
      condition: {
        operator: "and",
        conditions: [
          { variable: "enclosure_type", operator: "equals", value: "sliding" },
          { variable: "track_preference", operator: "equals", value: "framed" },
        ],
      },
      content: [
        "    \"Frame: every glass panel (sliding AND fixed) has a full aluminum frame perimeter in {{hardware_finish_name}}, 1.5 to 2 inch wide\",",
        "    \"Track: enclosed integrated track inside a full-width header extrusion — rollers fully concealed\",",
        "    \"Bottom rail: full-width bottom track/rail running along the curb or tub deck, with channels for the framed panels\",",
        "    \"Glass: 1/4 inch tempered inside frame channels\",",
        "    \"Handles: {{handle_style_name}} attached to the FRAME of each panel (NOT through glass), on the outer edges only\"",
      ],
    },

    // ---------------------------------------------------------------
    // 7. hardware_layout close + preserve_exact + remove
    // ---------------------------------------------------------------
    {
      id: "preserve_remove",
      type: "specifications",
      content: [
        "  ],",
        "  \"preserve_exact\": [",
        "    \"shower head and shower arm — exact same wall, exact same height, exact same model\",",
        "    \"faucet, valve, and trim handles — exact same position and finish as input_1\",",
        "    \"tub or shower pan shape, color, and material\",",
        "    \"toilet, vanity, sink, mirror — exact same position\",",
        "    \"all wall tile pattern, color, and grout lines\",",
        "    \"floor tile pattern and color\",",
        "    \"wall niches, ledges, shelves, soap dishes\",",
        "    \"lighting fixtures and ceiling treatment\",",
        "    \"any windows or skylights\",",
        "    \"everything visible outside the shower enclosure footprint\"",
        "  ],",
        "  \"remove\": [",
        "    \"any existing shower glass, panel, or door from a prior installation\",",
        "    \"any existing shower curtain (cloth or vinyl)\",",
        "    \"any existing shower curtain rod (do NOT recolor it to match new hardware)\",",
        "    \"curtain hooks, rings, ties, weights\",",
        "    \"any existing door handle, track, roller, hinge, or pivot from a prior installation\"",
        "  ],",
      ],
    },

    // ---------------------------------------------------------------
    // 8. forbidden_elements — open + universal entries
    // ---------------------------------------------------------------
    {
      id: "forbidden_open",
      type: "specifications",
      content: [
        "  \"forbidden_elements\": [",
        "    \"duplicated, mirrored, or relocated shower head, faucet, valve, or any plumbing\",",
        "    \"a second shower head on the opposite wall just because the first one was hidden by a curtain\",",
        "    \"shower curtain or curtain rod left visible — even if recolored, repainted, or restyled\",",
        "    \"any element borrowed from the inspiration image (if one is provided) other than the glass style, door type, framing, hardware finish, and handle silhouette\",",
        "    \"different handle styles or sizes between panels of the same enclosure\",",
        "    \"wall-mounted towel bars used in place of door pulls\",",
        "    \"extra knobs, faucets, fixtures, or accessories that are NOT in input_1\",",
        "    \"any change to wall tile, floor tile, grout, paint color, lighting, ceiling, toilet, vanity, or any non-shower element\",",
        "    \"output image dimensions different from input_1\",",
        "    \"a door narrower than the full shower entrance — the install MUST span wall-to-wall\",",
      ],
    },

    // ---------------------------------------------------------------
    // 9. forbidden — enclosure-specific
    // ---------------------------------------------------------------
    {
      id: "forbidden_hinged",
      type: "specifications",
      condition: { variable: "enclosure_type", operator: "equals", value: "hinged" },
      content: [
        "    \"the hinged door rendered swung OPEN, tilted open, or ajar — the door must be FULLY CLOSED against the adjacent fixed panel or wall\",",
        "    \"hinges shown on BOTH sides of the door (hinges live on ONE side only)\",",
        "    \"a top-mounted slider track or rail (this is a hinged door, not a slider)\",",
        "    \"pivot hardware at top and bottom of the door (this is a hinged door, not a pivot)\",",
        "    \"a sliding panel rendered alongside the hinged door\",",
      ],
    },
    {
      id: "forbidden_pivot",
      type: "specifications",
      condition: { variable: "enclosure_type", operator: "equals", value: "pivot" },
      content: [
        "    \"THE #1 PIVOT FAILURE MODE: rendering this door as a HINGED door with side-mounted hinges along a vertical edge. Pivot doors have NO side hinges anywhere. If you find yourself about to draw a hinge on the left or right edge of the door, STOP — re-read the pivot configuration and put the hardware at the TOP and BOTTOM horizontal edges instead.\",",
        "    \"the pivot door rendered swung OPEN, tilted open, or ajar — the door must be FULLY CLOSED against the adjacent fixed panel or wall\",",
        "    \"side-mounted hinges, butt hinges, barrel hinges, or ANY hinge-like hardware along EITHER vertical edge of the pivot door (this is the most common WRONG rendering — the door is a PIVOT, not a hinged door)\",",
        "    \"ANY metal hardware, bracket, clamp, or fitting visible along the vertical edges of the door (vertical edges are completely BARE on a pivot)\",",
        "    \"hardware that suggests the door swings on a vertical-edge axis like a regular hinged door (the pivot axis is OFFSET 4-6 inches INWARD from a vertical edge, not on the edge itself)\",",
        "    \"a top-mounted slider track or rollers (this is a pivot, not a slider)\",",
        "    \"the door rendered as a sliding panel\",",
        "    \"the door rendered as a regular hinged swing door — the pivot mechanism (offset top+bottom axis) is fundamentally different from hinges and must be visible in the render\",",
        "    \"pivot hardware on BOTH sides — pivot is on ONE side only, offset 4-6 inches from one edge\",",
        "    \"pivot fittings positioned on the vertical edges of the door instead of the top and bottom horizontal edges\",",
      ],
    },
    {
      id: "forbidden_sliding",
      type: "specifications",
      condition: { variable: "enclosure_type", operator: "equals", value: "sliding" },
      content: [
        "    \"side-mounted hinges (this is a slider, not a hinged door)\",",
        "    \"a pivot mechanism at top and bottom (this is a slider, not a pivot)\",",
        "    \"sliding doors rendered OPEN with one panel hidden behind the other (always render FULLY CLOSED with both panels visible)\",",
        "    \"three sets of rollers — there are exactly TWO roller carriages per panel\",",
        "    \"handles at the center seam where the two panels meet (handles only on the OUTER edges)\",",
        "    \"a single panel rendered when {{sliding_count}} were requested\",",
      ],
    },

    // ---------------------------------------------------------------
    // 10. forbidden — framing-specific
    // ---------------------------------------------------------------
    {
      id: "forbidden_frameless",
      type: "specifications",
      condition: { variable: "track_preference", operator: "equals", value: "frameless" },
      content: [
        "    \"any aluminum U-channel along walls, base, top, or curb (frameless means NO channels)\",",
        "    \"a frame on three sides of the enclosure (this is the most common frameless rendering error — it is FORBIDDEN)\",",
        "    \"a frame along just the bottom or just the top of the door\",",
        "    \"a bottom track or curb channel running across the floor\",",
        "    \"metal edging hiding any glass edge (frameless glass edges are EXPOSED, flat, and smooth)\",",
        "    \"a header bar that runs continuously across the top in line with the glass\",",
      ],
    },
    {
      id: "forbidden_semi",
      type: "specifications",
      condition: { variable: "track_preference", operator: "equals", value: "semi_frameless" },
      content: [
        "    \"a perimeter frame around the swinging/sliding/pivoting door panel (in semi-frameless, the OPERATING door is frameless)\",",
        "    \"a fully frameless rendering with no channels anywhere (semi-frameless DOES include U-channels on the FIXED panels)\",",
      ],
    },
    {
      id: "forbidden_framed",
      type: "specifications",
      condition: { variable: "track_preference", operator: "equals", value: "framed" },
      content: [
        "    \"exposed glass edges on any panel (framed means ALL edges are inside the frame)\",",
        "    \"a frame on only some panels — every glass piece has a full perimeter frame\",",
      ],
    },

    // ---------------------------------------------------------------
    // 11. forbidden — handle-specific
    // ---------------------------------------------------------------
    {
      id: "forbidden_handle_ladder",
      type: "specifications",
      condition: { variable: "handle_style", operator: "equals", value: "ladder" },
      content: [
        "    \"a wall-mounted towel bar used instead of a ladder pull on the door (the ladder pull is mounted ON the door glass or frame, not on the wall)\",",
        "    \"a square pull, D-pull, or knob substituted for the requested ladder pull\",",
      ],
    },
    {
      id: "forbidden_handle_square",
      type: "specifications",
      condition: { variable: "handle_style", operator: "equals", value: "square" },
      content: [
        "    \"a ladder pull, D-pull, knob, or towel bar substituted for the requested square pull\",",
      ],
    },
    {
      id: "forbidden_handle_dpull",
      type: "specifications",
      condition: { variable: "handle_style", operator: "equals", value: "d_pull" },
      content: [
        "    \"a ladder pull, square pull, knob, or towel bar substituted for the requested crescent/D pull\",",
      ],
    },
    {
      id: "forbidden_handle_knob",
      type: "specifications",
      condition: { variable: "handle_style", operator: "equals", value: "knob" },
      content: [
        "    \"a ladder pull, square pull, D-pull, or towel bar substituted for the requested knob\",",
        "    \"two knobs of different sizes — every knob is identical\",",
      ],
    },

    // ---------------------------------------------------------------
    // 12. forbidden_elements close + self_check open
    // ---------------------------------------------------------------
    {
      id: "selfcheck_open",
      type: "instructions",
      content: [
        "    \"any glass clamp not actually attached to a glass panel or solid wall (no floating clamps)\",",
        "    \"a channel piece behind a hinge\",",
        "    \"clamps on the bottom edge of a frameless panel that has no fixed panel below it\"",
        "  ],",
        "  \"self_check_before_output\": [",
        "    \"NO-OP CHECK: Is the new shower enclosure visibly present in the output? Can you point to glass edges, the {{handle_style_name}} handle, AND the door-type-appropriate hardware (frame / hinges / pivot fittings / track + rollers)? If the output looks identical to input_1, the generation has FAILED — re-render with the enclosure clearly installed.\",",
        "    \"Is the bathroom in the output the SAME bathroom as input_1 (same walls, tile, fixtures, lighting)?\",",
        "    \"Is the door type EXACTLY {{enclosure_type_name}}? (no wrong type substituted)\",",
        "    \"Is the framing EXACTLY {{track_preference_name}}? (no extra frame, no missing frame, no three-sided frame on a frameless install)\",",
        "    \"Is the glass style EXACTLY {{glass_style_name}} on EVERY glass panel?\",",
        "    \"Is every piece of hardware in {{hardware_finish_name}}?\",",
        "    \"Are all fixtures (shower head, faucet, valve, plumbing, toilet, vanity) in the SAME positions as input_1, with no duplicates and no mirroring?\",",
        "    \"Has the original shower curtain and curtain rod been REMOVED ENTIRELY (not painted, not restyled)?\",",
        "    \"Does the new enclosure span WALL-TO-WALL across the full shower entrance?\",",
      ],
    },

    // ---------------------------------------------------------------
    // 13. self_check — enclosure-specific
    // ---------------------------------------------------------------
    {
      id: "selfcheck_hinged",
      type: "instructions",
      condition: { variable: "enclosure_type", operator: "equals", value: "hinged" },
      content: [
        "    \"Is the hinged door rendered FULLY CLOSED (not swung open, not tilted, not ajar)?\",",
        "    \"Does the glass match the requested height? Spec says: {{hinged_height}}\",",
        "    \"Do the hinges sit on the EXACT side requested by the spec? Spec says: {{hinged_hinge_axis}}\",",
        "    \"Is the handle on the side requested by the spec? Spec says: {{hinged_handle_position}}\",",
        "    \"Is the door count EXACTLY {{hinged_count}} (matching is_double = {{hinged_is_double}})?\",",
      ],
    },
    {
      id: "selfcheck_pivot",
      type: "instructions",
      condition: { variable: "enclosure_type", operator: "equals", value: "pivot" },
      content: [
        "    \"Is the pivot door rendered FULLY CLOSED (not swung open, not tilted, not ajar)?\",",
        "    \"Is the offset pivot axis on the EXACT side requested by the spec? Spec says: {{pivot_axis}}\",",
        "    \"Is the handle on the side requested by the spec? Spec says: {{pivot_handle_position}}\",",
        "    \"Is the door count EXACTLY {{pivot_count}} (matching is_double = {{pivot_is_double}})?\",",
        "    \"Does every region in the spatial_map match the render? TOP edge: {{pivot_top_fitting_location}} | BOTTOM edge: {{pivot_bottom_fitting_location}} | LEFT edge: {{pivot_left_edge_layout}} | RIGHT edge: {{pivot_right_edge_layout}}\",",
        "    \"Are ALL FOUR corners of the door bare exposed glass (no hardware at any corner)?\",",
        "    \"Is the handle at the exact position the spatial_map describes? Spec says: {{pivot_handle_exact_position}}\",",
        "    \"Is the fixed return panel where the spatial_map places it? Spec says: {{pivot_fixed_panel_position}}\",",
        "    \"Did you double-check that NONE of the summary_things_NOT_present items appear in the render (especially: no side hinges, no top track, no bottom track, no second handle)?\",",
      ],
    },
    {
      id: "selfcheck_sliding",
      type: "instructions",
      condition: { variable: "enclosure_type", operator: "equals", value: "sliding" },
      content: [
        "    \"Are the doors rendered FULLY CLOSED with both panels visible (not slid open)?\",",
        "    \"Is the slide direction consistent with the spec? Spec says: {{sliding_direction}}\",",
        "    \"Is the panel count EXACTLY {{sliding_count}} (matching is_double = {{sliding_is_double}})?\",",
        "    \"Are handles ONLY on the outer edges of panels (never at the center seam)?\",",
        "    \"Are there exactly TWO roller carriages per panel (not three sets)?\",",
      ],
    },

    // ---------------------------------------------------------------
    // 14. self_check close + spec close + final outro
    // ---------------------------------------------------------------
    {
      id: "spec_close",
      type: "instructions",
      content: [
        "    \"Is every handle a {{handle_style_name}}, identical in style and size on every panel?\",",
        "    \"Do the output pixel dimensions exactly match input_1?\"",
        "  ]",
        "}",
        "</INSTALL_SPECIFICATION>",
        "",
        "Generate a single photorealistic image that follows the specification exactly.",
        "The output must be indistinguishable from a professional installation photo of THIS bathroom — input_1 with the new shower enclosure installed in place of any existing door, glass, or curtain.",
      ],
    },
  ],
  variables: [
    { name: "shower_shape", type: "string", required: true, description: "Detected shower shape (standard, neo_angle, tub)" },
    { name: "enclosure_type", type: "string", required: true, description: "Enclosure type ID (hinged, pivot, sliding)" },
    { name: "enclosure_type_name", type: "catalog_lookup", catalog: "enclosureTypes", catalogProperty: "name", required: true, description: "Human-readable enclosure type name" },
    { name: "glass_style", type: "string", required: true, description: "Glass style ID" },
    { name: "glass_style_name", type: "catalog_lookup", catalog: "glassStyles", catalogProperty: "name", required: true, description: "Human-readable glass style name" },
    { name: "hardware_finish", type: "string", required: true, description: "Hardware finish ID" },
    { name: "hardware_finish_name", type: "catalog_lookup", catalog: "hardwareFinishes", catalogProperty: "name", required: true, description: "Human-readable hardware finish name" },
    { name: "handle_style", type: "string", required: true, description: "Handle style ID" },
    { name: "handle_style_name", type: "catalog_lookup", catalog: "handleStyles", catalogProperty: "name", required: true, description: "Human-readable handle style name" },
    { name: "track_preference", type: "string", required: true, description: "Framing preference ID" },
    { name: "track_preference_name", type: "catalog_lookup", catalog: "trackPreferences", catalogProperty: "name", required: true, description: "Human-readable framing preference name" },

    // hinged-specific (set by processor.buildVisualizationPromptFromTemplate)
    { name: "hinged_to_ceiling", type: "string", required: false, default: "No", description: "Whether hinged door extends to ceiling (Yes/No)" },
    { name: "hinged_direction", type: "string", required: false, default: "swing left (hinges on the LEFT vertical edge of the door panel)", description: "Hinged door swing direction (expanded by processor)" },
    { name: "hinged_hinge_axis", type: "string", required: false, default: "side-mounted hinges along the LEFT vertical edge of the door panel ONLY (NEVER pivot mechanism, NEVER top track)", description: "Side-specific hinge axis clause (expanded by processor)" },
    { name: "hinged_handle_position", type: "string", required: false, default: "on the RIGHT vertical edge of the door panel (the edge OPPOSITE the hinges)", description: "Side-specific handle position clause (expanded by processor)" },
    { name: "hinged_count", type: "string", required: false, default: "one door", description: "Hinged door count phrase" },
    { name: "hinged_is_double", type: "string", required: false, default: "false", description: "Whether the hinged config is a double/french-door pair" },
    { name: "hinged_height", type: "string", required: false, default: "standard 76-78 inch door height with open space above the glass", description: "Hinged door height spec phrase" },

    // pivot-specific
    { name: "pivot_direction", type: "string", required: false, default: "pivot right (vertical pivot axis on the RIGHT side)", description: "Pivot door swing direction (expanded by processor)" },
    { name: "pivot_axis", type: "string", required: false, default: "vertical pivot axis on the RIGHT side of the door panel, offset 4-6 inches IN from the RIGHT vertical edge", description: "Side-specific pivot axis clause (expanded by processor)" },
    { name: "pivot_handle_position", type: "string", required: false, default: "on the LEFT side of the door panel (the side OPPOSITE the pivot axis)", description: "Side-specific pivot handle position clause (expanded by processor)" },
    { name: "pivot_count", type: "string", required: false, default: "one door", description: "Pivot door count phrase" },
    { name: "pivot_is_double", type: "string", required: false, default: "false", description: "Whether the pivot config is double" },
    // pivot spatial map — region-by-region "where things ARE / are NOT" so the
    // model has explicit textual coordinates to pair with the reference photo.
    { name: "pivot_top_fitting_location", type: "string", required: false, default: "ONE small pivot fitting on the TOP horizontal edge, offset 4-6 inches from one vertical edge of the door. Rest of top edge is BARE flat glass.", description: "Where on the top edge the top pivot fitting sits" },
    { name: "pivot_bottom_fitting_location", type: "string", required: false, default: "ONE small pivot pin embedded in the floor or curb directly below the top fitting. Rest of bottom edge is BARE flat glass.", description: "Where on the bottom edge the bottom pivot pin sits" },
    { name: "pivot_left_edge_layout", type: "string", required: false, default: "LEFT VERTICAL EDGE OF DOOR: COMPLETELY BARE. No hinges, no clamps, no brackets, no fittings. Smooth flat exposed glass top to bottom.", description: "What lives on the door's left vertical edge" },
    { name: "pivot_right_edge_layout", type: "string", required: false, default: "RIGHT VERTICAL EDGE OF DOOR: COMPLETELY BARE. No hinges, no clamps, no brackets, no fittings. Smooth flat exposed glass top to bottom.", description: "What lives on the door's right vertical edge" },
    { name: "pivot_handle_exact_position", type: "string", required: false, default: "ONE through-glass handle on the side OPPOSITE the offset pivot, vertically oriented, centered approximately 40 inches up from the floor, offset 2-3 inches IN from that vertical edge of the door.", description: "Exact location of the handle on the pivot door" },
    { name: "pivot_fixed_panel_position", type: "string", required: false, default: "A single fixed-glass return panel adjacent to the pivot door on the pivot-axis side, spanning from the door to the wall.", description: "Where the fixed return panel sits relative to the pivot door" },
    { name: "pivot_corner_tl", type: "string", required: false, default: "TOP-LEFT CORNER OF DOOR: BARE — exposed flat glass corner only. No hardware at this corner.", description: "Top-left corner of the door panel — bare" },
    { name: "pivot_corner_tr", type: "string", required: false, default: "TOP-RIGHT CORNER OF DOOR: BARE — exposed flat glass corner only. No hardware at this corner.", description: "Top-right corner of the door panel — bare" },
    { name: "pivot_corner_bl", type: "string", required: false, default: "BOTTOM-LEFT CORNER OF DOOR: BARE — exposed flat glass corner only. No hardware at this corner.", description: "Bottom-left corner of the door panel — bare" },
    { name: "pivot_corner_br", type: "string", required: false, default: "BOTTOM-RIGHT CORNER OF DOOR: BARE — exposed flat glass corner only. No hardware at this corner.", description: "Bottom-right corner of the door panel — bare" },

    // sliding-specific
    { name: "sliding_type", type: "string", required: false, default: "single sliding panel against a fixed return panel", description: "Sliding door variant phrase" },
    { name: "sliding_direction", type: "string", required: false, default: "left", description: "Sliding direction" },
    { name: "sliding_count", type: "string", required: false, default: "one sliding glass panel plus one fixed glass panel", description: "Sliding panel count phrase" },
    { name: "sliding_is_double", type: "string", required: false, default: "false", description: "Whether the sliding config is double bypass" },
  ],
  metadata: {
    createdAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z",
    author: "Gatsby Glass Team",
    tags: ["visualization", "shower", "photorealistic", "json-spec"],
    notes: "v3.0.0 — Structured <INSTALL_SPECIFICATION> JSON-payload prompt. Forbidden_elements and self_check arrays derived directly from the 51 reported issue clusters. Per-(enclosure x framing) hardware_layout enumeration replaces the dead-code visualization-v1.json blocks.",
  },
};

// ---------------------------------------------------------------------------
// INSPIRATION TEMPLATE — style donor only, NEVER replace target identity
// ---------------------------------------------------------------------------

export const inspirationTemplate: PromptTemplate = {
  id: "inspiration-v2",
  version: "2.0.0",
  name: "Inspiration Matching Prompt (locked-down)",
  type: "inspiration",
  description: "Treats the inspiration image as a STYLE DONOR only — borrows glass style/door type/finish/framing/handle silhouette but preserves the target bathroom's identity exactly.",
  sections: [
    {
      id: "intro",
      type: "header",
      content: [
        "You are editing a target bathroom photo (input_1) to install a new shower glass enclosure. A second image (input_2) has been provided as STYLE INSPIRATION ONLY.",
        "",
        "CRITICAL UNIVERSAL RULES:",
        "1. The OUTPUT must be input_1's bathroom with a new shower enclosure. The output is NEVER input_2 and NEVER any other room.",
        "2. The inspiration image (input_2) is a STYLE DONOR — borrow ONLY: door type, framing style, glass style, hardware finish, and handle silhouette. Nothing else.",
        "3. Do NOT copy from input_2: tile pattern, wall color, floor, ceiling, toilet, vanity, sink, tub, shower pan, shower head model or position, faucet/valve position, niches, lighting fixtures, decor, plants, towels, bottles, or any other non-glass element.",
        "4. PRESERVE input_1's bathroom identity exactly: walls, tile, floor, ceiling, lighting, all fixtures, and all fixture POSITIONS.",
        "5. NEVER duplicate or mirror input_1's fixtures. Plumbing stays on the wall it's actually on in input_1, regardless of where it appears in input_2.",
        "6. REMOVE entirely from the output: any existing shower glass, door, curtain, curtain rod, or curtain hooks present in input_1.",
        "7. The new enclosure must span the full WALL-TO-WALL shower entrance of input_1.",
        "8. Output pixel dimensions must match input_1 exactly.",
        "",
        "Use the following structured specification:",
        "",
      ],
    },
    {
      id: "spec",
      type: "specifications",
      content: [
        "<INSPIRATION_SPECIFICATION>",
        "{",
        "  \"task\": \"borrow_style_from_input_2_install_in_input_1\",",
        "  \"target\": {",
        "    \"image\": \"input_1\",",
        "    \"shower_type\": \"{{shower_shape}}\"",
        "  },",
        "  \"style_donor\": {",
        "    \"image\": \"input_2\",",
        "    \"extract_only\": [",
        "      \"door_type — hinged, pivot, or sliding (whichever is shown in input_2)\",",
        "      \"framing — frameless, semi-frameless, or framed (whichever is shown in input_2)\",",
        "      \"glass_style — clear, low-iron/ultra-clear, or rain/textured (whichever is shown in input_2)\",",
        "      \"hardware_finish — chrome, brushed nickel, matte black, polished brass, or oil-rubbed bronze (whichever is shown in input_2)\",",
        "      \"handle_silhouette — ladder pull, square pull, crescent/D pull, or knob (whichever is shown in input_2)\"",
        "    ]",
        "  },",
        "  \"preserve_from_target\": [",
        "    \"shower head and shower arm — exact wall, exact height, exact model from input_1\",",
        "    \"faucet, valve, and trim handles — exact position from input_1\",",
        "    \"tub or shower pan shape, color, material from input_1\",",
        "    \"toilet, vanity, sink, mirror — exact position from input_1\",",
        "    \"all wall tile pattern, color, grout — exactly as input_1\",",
        "    \"floor tile pattern and color — exactly as input_1\",",
        "    \"wall niches, ledges, shelves — exactly as input_1\",",
        "    \"lighting fixtures, ceiling, windows — exactly as input_1\",",
        "    \"output pixel dimensions match input_1\"",
        "  ],",
        "  \"forbidden_from_inspiration\": [",
        "    \"tile pattern, color, or material from input_2\",",
        "    \"wall color, paint, or finish from input_2\",",
        "    \"toilet, vanity, sink, or tub geometry from input_2\",",
        "    \"plumbing positions or shower head positions from input_2 — keep input_1's positions\",",
        "    \"wall niches, cutouts, ledges from input_2\",",
        "    \"decor, plants, bottles, towels, or other accessories from input_2\",",
        "    \"lighting style, color temperature, or fixtures from input_2 — keep input_1's lighting\",",
        "    \"floor pattern from input_2\",",
        "    \"any architectural detail from input_2 (windows, beams, ceiling treatment)\"",
        "  ],",
        "  \"forbidden_general\": [",
        "    \"returning input_2 itself or any crop/recolor of input_2 as the output\",",
        "    \"merging input_1 and input_2 into a hybrid bathroom\",",
        "    \"any existing shower curtain rod (do NOT recolor it to match new hardware)\",",
        "    \"shower curtain or curtain rod left visible — even if recolored, repainted, or restyled\",",
        "    \"duplicated, mirrored, or relocated shower head, faucet, valve, or any plumbing\",",
        "    \"different handle styles or sizes between panels of the same enclosure\",",
        "    \"any glass clamp not actually attached to a glass panel or solid wall (no floating clamps)\",",
        "    \"a door narrower than input_1's full shower entrance\",",
        "    \"different output dimensions from input_1\"",
        "  ],",
        "  \"self_check_before_output\": [",
        "    \"NO-OP CHECK: Is the new shower enclosure visibly present in the output? Can you point to glass edges, the door handle, AND door-type-appropriate hardware? If the output looks identical to input_1, the generation has FAILED — re-render with the enclosure clearly installed.\",",
        "    \"Is the output the SAME bathroom as input_1 (same walls, tile, fixtures)?\",",
        "    \"Is the output NOT input_2, and NOT a hybrid of the two?\",",
        "    \"Are all fixtures from input_1 in their exact original positions, with no duplicates?\",",
        "    \"Has any shower curtain or curtain rod from input_1 been removed entirely?\",",
        "    \"Does the new enclosure match input_2's door type, framing, glass style, finish, and handle silhouette?\",",
        "    \"Does the new enclosure span input_1's full wall-to-wall shower entrance?\",",
        "    \"Do output pixel dimensions match input_1 exactly?\"",
        "  ]",
        "}",
        "</INSPIRATION_SPECIFICATION>",
        "",
        "Generate a single photorealistic image: input_1's bathroom with a new shower enclosure that adopts input_2's glass style. The output must look like a professional installation photo of input_1.",
      ],
    },
  ],
  variables: [
    { name: "shower_shape", type: "string", required: true, description: "Detected shower shape of the target bathroom" },
  ],
  metadata: {
    createdAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z",
    author: "Gatsby Glass Team",
    tags: ["inspiration", "style-matching", "json-spec", "locked-down"],
    notes: "v2.0.0 — Locks down inspiration mode so the inspo image is treated strictly as a style donor. Preserve_from_target and forbidden_from_inspiration arrays derived from issues #21, #26, #28, #29, #30, #46, #51.",
  },
};

// ---------------------------------------------------------------------------
// SYSTEM TEMPLATE — universal preservation/removal/uniformity rules
// ---------------------------------------------------------------------------

export const systemTemplate: PromptTemplate = {
  id: "system-v2",
  version: "2.0.0",
  name: "System Prompt for Gemini (universal rules)",
  type: "system",
  description: "System-level instructions establishing universal preservation, removal, and uniformity rules across every visualization.",
  sections: [
    {
      id: "role",
      type: "header",
      content: [
        "You are an AI image generation assistant for Gatsby Glass, a high-end shower glass company.",
        "Your task is to edit a customer's bathroom photo to show a NEW shower glass installation in place of any existing shower glass, door, or curtain.",
      ],
    },
    {
      id: "universal_rules",
      type: "instructions",
      content: [
        "",
        "UNIVERSAL RULES (apply to every generation, override any conflicting interpretation of the user prompt):",
        "",
        "A. TARGET IDENTITY — the output is input_1's bathroom",
        "   1. The output image must be the SAME bathroom as input_1. Same walls, tile, floor, ceiling, lighting, fixtures, layout.",
        "   2. NEVER substitute a different room, a stock bathroom, or the inspiration photo (input_2 if provided) as the output.",
        "   3. Output pixel dimensions must EXACTLY match input_1.",
        "",
        "B. FIXTURE PRESERVATION — exact positions, no duplication",
        "   1. The shower head, shower arm, valve, faucet, and all plumbing remain on the EXACT walls and at the EXACT positions shown in input_1.",
        "   2. NEVER duplicate, mirror, or relocate any fixture. If input_1 has plumbing on the right wall, the output has plumbing only on the right wall — never also on the left.",
        "   3. If a shower curtain in input_1 is partially open, infer fixture positions ONLY from visible plumbing penetrations or wall protrusions. Do NOT assume left/right symmetry. Do NOT add a second mirrored shower head.",
        "   4. If a shower curtain in input_1 is fully closed and hides the fixtures, place a single typical wall-mounted shower head and valve on the wall most consistent with visible plumbing penetrations or trim — never both walls.",
        "   5. Toilet, vanity, sink, niches, lighting, and any non-shower element stay exactly as in input_1.",
        "",
        "C. REMOVAL — clean slate inside the shower enclosure footprint",
        "   1. REMOVE any existing shower glass, panel, door, hinge, track, roller, or pivot from a prior installation.",
        "   2. REMOVE any shower curtain (cloth or vinyl), shower curtain rod, curtain hooks, rings, ties, and weights. Do NOT recolor or repaint the curtain rod to match the new hardware — REMOVE IT entirely.",
        "",
        "D. NEW INSTALL — INSTALLING THE ENCLOSURE IS THE ENTIRE PURPOSE OF THIS GENERATION",
        "   0. INSTALLATION IS MANDATORY. The output MUST visibly contain the new shower enclosure described in the <INSTALL_SPECIFICATION>. Returning the input image (or an image that looks identical to the input) is a FAILURE.",
        "      • If input_1 already has an open shower alcove with no door or curtain, your job is HARDER, not easier — you must hallucinate the new enclosure from scratch and add it to the scene. DO NOT preserve the open alcove.",
        "      • If input_1 has a shower curtain or existing door, remove it AND add the new enclosure. Removal without installation is a FAILURE.",
        "      • If the shower has no obvious 'entrance' (e.g., a tub/shower combo with three tile walls and an open front), the new enclosure spans the entire open side of the shower footprint along the curb or tub edge.",
        "   1. The new enclosure MUST span the full WALL-TO-WALL shower entrance, regardless of how wide any prior partial door or curtain was. Do not match the width of any existing partial install.",
        "   2. The new enclosure MUST be VISIBLE in the output — at minimum the model must be able to point to (a) glass panel edges and surface reflections, (b) hardware appropriate to the framing/door-type (frame, hinges, pivot fittings, or track + rollers), and (c) the door handle. For frameless + clear glass installs this means you MUST render visible glass edge highlights, top/bottom pivot or hinge hardware, and the through-glass handle — otherwise the enclosure will appear absent.",
        "   3. Every piece of hardware (hinges, handles, tracks, pivots, clamps, frames) is rendered in ONE uniform finish.",
        "   4. Every glass panel uses ONE uniform glass style.",
        "   5. Every door panel uses the SAME identical handle (style + size + position).",
        "",
        "E. PHOTOREALISM",
        "   1. Match input_1's lighting direction, color temperature, intensity, and shadows.",
        "   2. Match input_1's perspective, camera angle, and lens.",
        "   3. The result must be indistinguishable from a professional architectural installation photo of input_1.",
        "",
        "F. FOLLOWING THE USER SPECIFICATION",
        "   1. The user prompt provides a structured <INSTALL_SPECIFICATION> or <INSPIRATION_SPECIFICATION> block. Treat it as the source of truth for what to install.",
        "   2. Honor every preserve_exact, remove, forbidden_elements, and self_check entry. Run the self_check_before_output mentally before producing the image.",
      ],
    },
  ],
  variables: [],
  metadata: {
    createdAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z",
    author: "Gatsby Glass Team",
    tags: ["system", "gemini", "core", "universal-rules"],
    notes: "v2.0.0 — Universal preservation/removal/uniformity rules covering target identity, fixture preservation (with partial-curtain handling), curtain rod removal, full wall-to-wall coverage, and uniform finishes/glass/handles. Maps directly to the 51 reported issue clusters.",
  },
};

// ---------------------------------------------------------------------------
// VALIDATION TEMPLATE — unchanged behavior, kept for completeness
// ---------------------------------------------------------------------------

export const validationTemplate: PromptTemplate = {
  id: "validation-v1",
  version: "1.0.1",
  name: "Image Validation Prompt",
  type: "validation",
  description: "Prompt template for validating bathroom images and detecting shower shape and existing hardware finish.",
  sections: [
    {
      id: "task",
      type: "header",
      content: [
        "Analyze this image to determine if it shows a bathroom or shower area where glass shower doors could be installed.",
      ],
    },
    {
      id: "guidelines",
      type: "instructions",
      content: [
        "",
        "VALIDATION GUIDELINES — BE EXTREMELY LENIENT:",
        "",
        "ACCEPT (isValid: true) if you see ANY of these:",
        "- Shower area (with or without existing glass)",
        "- Bathtub or tub/shower combo",
        "- Bathroom tiles on walls or floor",
        "- Shower fixtures (shower head, faucets, handles)",
        "- Bathroom vanity, toilet, or sink visible",
        "- Walk-in shower with glass panel",
        "- Any space that looks like it could have a shower door installed",
        "- Gray tiles, pebble floors, built-in niches — these are shower features",
        "",
        "REJECT (isValid: false) ONLY if the image is clearly:",
        "- Outdoors or exterior",
        "- Kitchen, living room, bedroom, or other non-bathroom room",
        "- Not a residential/commercial interior space",
        "- Completely unrelated to bathrooms",
      ],
    },
    {
      id: "shape_detection",
      type: "specifications",
      content: [
        "",
        "SHAPE DETECTION (if valid):",
        "Determine the shower layout:",
        "- 'standard': Most common — straight wall alcove, inline shower, walk-in shower, or 90-degree corner return",
        "- 'neo_angle': Corner shower with angled glass panels forming a diamond/pentagon shape (less common)",
        "- 'tub': Bathtub with or without existing shower fixtures",
      ],
    },
    {
      id: "response_format",
      type: "custom",
      content: [
        "",
        "RESPONSE:",
        "Return JSON with isValid (boolean), reason (string, only if invalid), shape (string), and detectedHardware (string).",
        "",
        "When in doubt, ACCEPT the image as valid.",
      ],
    },
  ],
  variables: [],
  metadata: {
    createdAt: "2026-01-27T00:00:00.000Z",
    updatedAt: "2026-01-27T00:00:00.000Z",
    author: "Gatsby Glass Team",
    tags: ["validation", "image-analysis", "shape-detection"],
    notes: "Used to validate uploaded images and detect shower configuration. Unchanged in this revision.",
  },
};

// ---------------------------------------------------------------------------
// REGISTRY
// ---------------------------------------------------------------------------

export const gatsbyGlassRegistry: PromptTemplateRegistry = {
  version: "3.0.0",
  updatedAt: "2026-05-07T00:00:00.000Z",
  activeTemplates: {
    visualization: "visualization-v3",
    inspiration: "inspiration-v2",
    system: "system-v2",
    validation: "validation-v1",
  },
  templates: {
    "visualization-v3": { path: "./visualization-v3.json", version: "3.0.0", active: true },
    "inspiration-v2": { path: "./inspiration-v2.json", version: "2.0.0", active: true },
    "system-v2": { path: "./system-v2.json", version: "2.0.0", active: true },
    "validation-v1": { path: "./validation-v1.json", version: "1.0.1", active: true },
  },
};

export const gatsbyGlassTemplates: Record<string, PromptTemplate> = {
  'visualization-v3': visualizationTemplate,
  'inspiration-v2': inspirationTemplate,
  'system-v2': systemTemplate,
  'validation-v1': validationTemplate,
};
