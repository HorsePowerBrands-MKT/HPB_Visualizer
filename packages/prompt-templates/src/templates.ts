/**
 * Inline Template Definitions
 * 
 * Templates defined as TypeScript objects for better bundler compatibility.
 */

import type { PromptTemplate, PromptTemplateRegistry } from './types';

export const visualizationTemplate: PromptTemplate = {
  id: "visualization-v2",
  version: "2.0.0",
  name: "Shower Visualization Prompt",
  type: "visualization",
  description: "Main prompt template for generating photorealistic shower glass visualizations",
  sections: [
    {
      id: "header",
      type: "header",
      content: [
        "You are editing a photo of a bathroom to show a NEW shower glass door installation.",
        "",
        "IMPORTANT: You must REPLACE any existing shower glass/door with the NEW configuration specified below.",
        "Do NOT keep the existing shower door - REMOVE it and install the new one as described."
      ]
    },
    {
      id: "task",
      type: "specifications",
      content: [
        "",
        "=== YOUR TASK ===",
        "Remove any existing shower glass, door, or panel from this {{shower_shape}} shower.",
        "Replace it with a COMPLETELY NEW shower enclosure as specified below.",
        ""
      ]
    },
    {
      id: "door_type_spec",
      type: "specifications",
      content: [
        "=== DOOR TYPE: {{enclosure_type_name}} ===",
        "{{door_type_description}}",
        ""
      ]
    },
    {
      id: "glass_spec",
      type: "specifications",
      content: [
        "=== GLASS STYLE: {{glass_style_name}} ===",
        "{{glass_style_description}}",
        ""
      ]
    },
    {
      id: "hardware_spec",
      type: "specifications",
      content: [
        "=== HARDWARE FINISH: {{hardware_finish_name}} ===",
        "{{hardware_finish_description}}",
        ""
      ]
    },
    {
      id: "handle_spec",
      type: "specifications",
      content: [
        "=== HANDLE STYLE: {{handle_style_name}} ===",
        "{{handle_style_description}}",
        ""
      ]
    },
    {
      id: "framing_spec",
      type: "specifications",
      content: [
        "=== FRAMING: {{track_preference_name}} ===",
        "{{framing_description}}",
        ""
      ]
    },
    {
      id: "hinged_config",
      type: "configuration",
      condition: {
        variable: "enclosure_type",
        operator: "equals",
        value: "hinged"
      },
      content: [
        "=== HINGED DOOR CONFIGURATION ===",
        "- Extends to ceiling: {{hinged_to_ceiling}}",
        "- Swing direction: {{hinged_direction}}",
        "- The door must have VISIBLE HINGES on one side",
        "- The door must SWING open (not slide)",
        ""
      ]
    },
    {
      id: "pivot_config",
      type: "configuration",
      condition: {
        variable: "enclosure_type",
        operator: "equals",
        value: "pivot"
      },
      content: [
        "=== PIVOT DOOR CONFIGURATION ===",
        "- Swing direction: {{pivot_direction}}",
        "- The door must have PIVOT HARDWARE at top and bottom",
        "- The door rotates on a pivot axis (not side hinges)",
        ""
      ]
    },
    {
      id: "sliding_config",
      type: "configuration",
      condition: {
        variable: "enclosure_type",
        operator: "equals",
        value: "sliding"
      },
      content: [
        "=== SLIDING DOOR CONFIGURATION ===",
        "- Type: {{sliding_type}}",
        "- Slide direction: {{sliding_direction}}",
        "- Must show TRACK/RAIL at the top",
        "- Door slides horizontally on track (does NOT swing)",
        ""
      ]
    },
    {
      id: "instructions",
      type: "instructions",
      content: [
        "=== CRITICAL REQUIREMENTS ===",
        "",
        "1. REMOVE the existing shower glass/door completely",
        "2. INSTALL the new {{enclosure_type_name}} exactly as described above",
        "3. The new door must be CLEARLY VISIBLE and DIFFERENT from what was there before",
        "4. All hardware (hinges, handles, tracks) must be {{hardware_finish_name}}",
        "5. The handle must be a {{handle_style_name}} style",
        "6. The installation must be {{track_preference_name}}",
        "",
        "=== PRESERVE THESE ELEMENTS ===",
        "- Original bathroom lighting and color temperature",
        "- All tile work, walls, and architectural details",
        "- Fixtures (shower head, faucets, etc.)",
        "- Everything outside the shower enclosure area",
        "",
        "=== OUTPUT ===",
        "Generate a photorealistic image that looks like a professional installation photo.",
        "The new shower door should look like it was professionally installed."
      ]
    }
  ],
  variables: [
    { name: "shower_shape", type: "string", required: true, description: "The detected shower shape (standard, neo_angle, tub)" },
    { name: "enclosure_type", type: "string", required: true, description: "The enclosure type ID (hinged, pivot, sliding)" },
    { name: "enclosure_type_name", type: "catalog_lookup", catalog: "enclosureTypes", catalogProperty: "name", required: true, description: "Human-readable enclosure type name" },
    { name: "door_type_description", type: "string", required: true, description: "Detailed description of the door type" },
    { name: "glass_style", type: "string", required: true, description: "The glass style ID" },
    { name: "glass_style_name", type: "catalog_lookup", catalog: "glassStyles", catalogProperty: "name", required: true, description: "Human-readable glass style name" },
    { name: "glass_style_description", type: "string", required: true, description: "Detailed description of the glass style" },
    { name: "hardware_finish", type: "string", required: true, description: "The hardware finish ID" },
    { name: "hardware_finish_name", type: "catalog_lookup", catalog: "hardwareFinishes", catalogProperty: "name", required: true, description: "Human-readable hardware finish name" },
    { name: "hardware_finish_description", type: "string", required: true, description: "Detailed description of the hardware finish" },
    { name: "handle_style", type: "string", required: true, description: "The handle style ID" },
    { name: "handle_style_name", type: "catalog_lookup", catalog: "handleStyles", catalogProperty: "name", required: true, description: "Human-readable handle style name" },
    { name: "handle_style_description", type: "string", required: true, description: "Detailed description of the handle style" },
    { name: "track_preference", type: "string", required: true, description: "The framing preference ID" },
    { name: "track_preference_name", type: "catalog_lookup", catalog: "trackPreferences", catalogProperty: "name", required: true, description: "Human-readable framing preference name" },
    { name: "framing_description", type: "string", required: true, description: "Detailed description of the framing style" },
    { name: "hinged_to_ceiling", type: "string", required: false, default: "No", description: "Whether hinged door extends to ceiling (Yes/No)" },
    { name: "hinged_direction", type: "string", required: false, description: "Hinged door swing direction" },
    { name: "pivot_direction", type: "string", required: false, description: "Pivot door swing direction" },
    { name: "sliding_type", type: "string", required: false, description: "Sliding door type (single/double)" },
    { name: "sliding_direction", type: "string", required: false, description: "Sliding door direction" }
  ],
  metadata: {
    createdAt: "2026-01-27T00:00:00.000Z",
    updatedAt: "2026-01-27T00:00:00.000Z",
    author: "Gatsby Glass Team",
    tags: ["visualization", "shower", "photorealistic"],
    notes: "v2.0.0 - Added detailed option descriptions for better AI understanding"
  }
};

export const inspirationTemplate: PromptTemplate = {
  id: "inspiration-v1",
  version: "1.0.0",
  name: "Inspiration Matching Prompt",
  type: "inspiration",
  description: "Prompt template for matching an inspiration image style to a target bathroom",
  sections: [
    {
      id: "header",
      type: "header",
      content: [
        "Analyze the inspiration image and recreate the shower glass style in the target bathroom photo."
      ]
    },
    {
      id: "target_info",
      type: "specifications",
      content: [
        "",
        "TARGET SHOWER TYPE: {{shower_shape}}"
      ]
    },
    {
      id: "instructions",
      type: "instructions",
      content: [
        "",
        "INSTRUCTIONS:",
        "1. Identify the door type, glass style, hardware finish, and overall aesthetic from the inspiration photo",
        "2. Apply the same style, finishes, and design elements to the target bathroom",
        "3. Adapt the design to fit the target bathroom's specific layout and dimensions",
        "4. Maintain the lighting and ambiance of the target bathroom",
        "5. Ensure the result looks professionally installed and matches the inspiration's premium quality",
        "6. Only modify the shower enclosure in the target photo - preserve everything else",
        "",
        "The goal is to show the customer how the inspiration design would look in their actual bathroom."
      ]
    }
  ],
  variables: [
    { name: "shower_shape", type: "string", required: true, description: "The detected shower shape of the target bathroom" }
  ],
  metadata: {
    createdAt: "2026-01-27T00:00:00.000Z",
    updatedAt: "2026-01-27T00:00:00.000Z",
    author: "Gatsby Glass Team",
    tags: ["inspiration", "style-matching"],
    notes: "Initial JSON template version migrated from string-based prompt"
  }
};

export const systemTemplate: PromptTemplate = {
  id: "system-v1",
  version: "1.0.0",
  name: "System Prompt for Gemini",
  type: "system",
  description: "System-level instructions for the AI model defining its role and constraints",
  sections: [
    {
      id: "role",
      type: "header",
      content: [
        "You are an AI image generation assistant for Gatsby Glass, a high-end shower glass company.",
        "Your task is to create photorealistic visualizations of custom shower glass installations."
      ]
    },
    {
      id: "requirements",
      type: "instructions",
      content: [
        "",
        "CRITICAL REQUIREMENTS:",
        "1. Generate images that look like professional architectural photography",
        "2. Match the lighting, perspective, and style of the input bathroom photo",
        "3. The shower glass must look crystal clear and premium quality",
        "4. Hardware (handles, hinges) must be accurately rendered in the specified finish",
        "5. The result should be indistinguishable from a real installation photo",
        "6. Maintain all architectural details of the original bathroom",
        "7. Only modify the shower enclosure area - everything else stays the same"
      ]
    }
  ],
  variables: [],
  metadata: {
    createdAt: "2026-01-27T00:00:00.000Z",
    updatedAt: "2026-01-27T00:00:00.000Z",
    author: "Gatsby Glass Team",
    tags: ["system", "gemini", "core"],
    notes: "Core system prompt defining AI behavior and constraints"
  }
};

export const validationTemplate: PromptTemplate = {
  id: "validation-v1",
  version: "1.0.1",
  name: "Image Validation Prompt",
  type: "validation",
  description: "Prompt template for validating bathroom images and detecting shower shape",
  sections: [
    {
      id: "task",
      type: "header",
      content: [
        "Analyze this image to determine if it shows a bathroom or shower area where glass shower doors could be installed."
      ]
    },
    {
      id: "guidelines",
      type: "instructions",
      content: [
        "",
        "VALIDATION GUIDELINES - BE EXTREMELY LENIENT:",
        "",
        "ACCEPT (isValid: true) if you see ANY of these:",
        "- Shower area (with or without existing glass)",
        "- Bathtub or tub/shower combo",
        "- Bathroom tiles on walls or floor",
        "- Shower fixtures (shower head, faucets, handles)",
        "- Bathroom vanity, toilet, or sink visible",
        "- Walk-in shower with glass panel",
        "- Any space that looks like it could have a shower door installed",
        "- Gray tiles, pebble floors, built-in niches - these are shower features",
        "",
        "REJECT (isValid: false) ONLY if the image is clearly:",
        "- Outdoors or exterior",
        "- Kitchen, living room, bedroom, or other non-bathroom room",
        "- Not a residential/commercial interior space",
        "- Completely unrelated to bathrooms"
      ]
    },
    {
      id: "shape_detection",
      type: "specifications",
      content: [
        "",
        "SHAPE DETECTION (if valid):",
        "Determine the shower layout:",
        "- 'standard': Most common - straight wall alcove, inline shower, walk-in shower, or 90-degree corner return",
        "- 'neo_angle': Corner shower with angled glass panels forming a diamond/pentagon shape (less common)",
        "- 'tub': Bathtub with or without existing shower fixtures"
      ]
    },
    {
      id: "response_format",
      type: "custom",
      content: [
        "",
        "RESPONSE:",
        "Return JSON with isValid (boolean), reason (string, only if invalid), and shape (string).",
        "",
        "When in doubt, ACCEPT the image as valid."
      ]
    }
  ],
  variables: [],
  metadata: {
    createdAt: "2026-01-27T00:00:00.000Z",
    updatedAt: "2026-01-27T00:00:00.000Z",
    author: "Gatsby Glass Team",
    tags: ["validation", "image-analysis", "shape-detection"],
    notes: "Used to validate uploaded images and detect shower configuration. Made more lenient in v1.0.1"
  }
};

export const registryData: PromptTemplateRegistry = {
  version: "1.0.0",
  updatedAt: "2026-01-27T00:00:00.000Z",
  activeTemplates: {
    visualization: "visualization-v1",
    inspiration: "inspiration-v1",
    system: "system-v1",
    validation: "validation-v1"
  },
  templates: {
    "visualization-v1": { path: "./visualization-v1.json", version: "1.0.0", active: true },
    "inspiration-v1": { path: "./inspiration-v1.json", version: "1.0.0", active: true },
    "system-v1": { path: "./system-v1.json", version: "1.0.0", active: true },
    "validation-v1": { path: "./validation-v1.json", version: "1.0.0", active: true }
  }
};

export const templates: Record<string, PromptTemplate> = {
  'visualization-v1': visualizationTemplate,
  'inspiration-v1': inspirationTemplate,
  'system-v1': systemTemplate,
  'validation-v1': validationTemplate,
};
