/**
 * Prompt Template Processor
 * 
 * Loads JSON templates and resolves them into final prompt strings.
 * Supports variable interpolation, catalog lookups, and conditional sections.
 *
 * Brand apps register their templates via registerBrandTemplates() at startup.
 * If no brand templates are registered, falls back to the built-in defaults.
 */

import type {
  PromptTemplate,
  PromptTemplateType,
  TemplateSection,
  TemplateCondition,
  ProcessedPrompt,
  ProcessorOptions,
  PromptTemplateRegistry,
} from './types';

// Built-in default templates (Gatsby Glass -- kept for backward compatibility)
import {
  templates as defaultTemplates,
  registryData as defaultRegistryData,
} from './templates';

// Active template store -- brands override these via registerBrandTemplates()
let activeTemplateMap: Record<string, PromptTemplate> = defaultTemplates;
let activeRegistryData: PromptTemplateRegistry = defaultRegistryData;

/**
 * Register brand-specific templates.
 * Call this at app startup to replace the built-in defaults with your brand's templates.
 */
export function registerBrandTemplates(
  brandTemplates: Record<string, PromptTemplate>,
  brandRegistry: PromptTemplateRegistry
): void {
  activeTemplateMap = brandTemplates;
  activeRegistryData = brandRegistry;
}

/**
 * Get the active template for a given type
 */
export function getActiveTemplate(type: PromptTemplateType): PromptTemplate {
  const templateId = activeRegistryData.activeTemplates[type];
  const template = activeTemplateMap[templateId];
  
  if (!template) {
    throw new Error(`No active template found for type: ${type}`);
  }
  
  return template;
}

/**
 * Get a template by its ID
 */
export function getTemplateById(id: string): PromptTemplate {
  const template = activeTemplateMap[id];
  
  if (!template) {
    throw new Error(`Template not found: ${id}`);
  }
  
  return template;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): PromptTemplate[] {
  return Object.values(activeTemplateMap);
}

/**
 * Get the template registry
 */
export function getRegistry() {
  return activeRegistryData;
}

/**
 * Create a simple hash of variables for caching
 */
function hashVariables(variables: Record<string, unknown>): string {
  const sorted = Object.keys(variables)
    .sort()
    .map(k => `${k}:${JSON.stringify(variables[k])}`)
    .join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Lookup a value from the catalog
 */
function catalogLookup(
  catalogName: string,
  key: string,
  property: string = 'name',
  catalogData?: Record<string, any>
): string {
  if (!catalogData) {
    return key; // Return raw key if no catalog provided
  }
  
  const catalog = catalogData[catalogName];
  
  if (!catalog) {
    return key; // Return raw key if catalog not found
  }
  
  const entry = catalog[key];
  
  if (!entry) {
    return key; // Return raw key if entry not found
  }
  
  return (entry as Record<string, string>)[property] || key;
}

/**
 * Evaluate a condition against variables
 */
function evaluateCondition(
  condition: TemplateCondition,
  variables: Record<string, unknown>
): boolean {
  // Handle compound conditions
  if (condition.operator === 'and') {
    if (!condition.conditions || condition.conditions.length === 0) {
      return true;
    }
    return condition.conditions.every(c => evaluateCondition(c, variables));
  }
  
  if (condition.operator === 'or') {
    if (!condition.conditions || condition.conditions.length === 0) {
      return false;
    }
    return condition.conditions.some(c => evaluateCondition(c, variables));
  }
  
  // Handle simple conditions
  const value = variables[condition.variable!];
  
  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    
    case 'not_equals':
      return value !== condition.value;
    
    case 'exists':
      return value !== undefined && value !== null && value !== '';
    
    case 'not_exists':
      return value === undefined || value === null || value === '';
    
    case 'in':
      if (Array.isArray(condition.value)) {
        return condition.value.includes(value as string | number | boolean);
      }
      return false;
    
    case 'not_in':
      if (Array.isArray(condition.value)) {
        return !condition.value.includes(value as string | number | boolean);
      }
      return true;
    
    default:
      return true;
  }
}

/**
 * Replace variable placeholders in text
 */
function interpolateVariables(
  text: string,
  resolvedVariables: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return resolvedVariables[varName] ?? match;
  });
}

/**
 * Resolve all variables from input data
 */
function resolveVariables(
  template: PromptTemplate,
  inputVariables: Record<string, unknown>,
  options: ProcessorOptions
): { resolved: Record<string, string>; warnings: string[] } {
  const resolved: Record<string, string> = {};
  const warnings: string[] = [];
  
  for (const varDef of template.variables) {
    const inputValue = inputVariables[varDef.name];
    
    // Handle catalog lookups
    if (varDef.type === 'catalog_lookup' && varDef.catalog) {
      // For catalog lookups, we need the base variable (e.g., glass_style for glass_style_name)
      const baseVarName = varDef.name.replace('_name', '');
      const baseValue = inputVariables[baseVarName];
      
      if (baseValue !== undefined && baseValue !== null) {
        resolved[varDef.name] = catalogLookup(
          varDef.catalog,
          String(baseValue),
          varDef.catalogProperty || 'name',
          options.catalog
        );
      } else if (varDef.default !== undefined) {
        resolved[varDef.name] = String(varDef.default);
      } else if (varDef.required && options.strictValidation) {
        warnings.push(`Missing required variable for catalog lookup: ${baseVarName}`);
      }
    }
    // Handle boolean conversion
    else if (varDef.type === 'boolean') {
      if (inputValue !== undefined) {
        resolved[varDef.name] = inputValue ? 'Yes' : 'No';
      } else if (varDef.default !== undefined) {
        resolved[varDef.name] = varDef.default ? 'Yes' : 'No';
      }
    }
    // Handle string/number
    else if (inputValue !== undefined && inputValue !== null) {
      // Apply custom transformer if provided
      if (options.transformers?.[varDef.name]) {
        resolved[varDef.name] = options.transformers[varDef.name](inputValue);
      } else {
        resolved[varDef.name] = String(inputValue);
      }
    }
    // Use default if available
    else if (varDef.default !== undefined) {
      resolved[varDef.name] = String(varDef.default);
    }
    // Warn if required and missing
    else if (varDef.required && options.strictValidation) {
      warnings.push(`Missing required variable: ${varDef.name}`);
    }
  }
  
  return { resolved, warnings };
}

/**
 * Process a section and its children
 */
function processSection(
  section: TemplateSection,
  resolvedVariables: Record<string, string>,
  inputVariables: Record<string, unknown>
): string[] {
  // Check condition if present
  if (section.condition) {
    if (!evaluateCondition(section.condition, inputVariables)) {
      return []; // Skip this section
    }
  }
  
  const lines: string[] = [];
  
  // Process content lines
  for (const line of section.content) {
    lines.push(interpolateVariables(line, resolvedVariables));
  }
  
  // Process child sections recursively
  if (section.children) {
    for (const child of section.children) {
      lines.push(...processSection(child, resolvedVariables, inputVariables));
    }
  }
  
  return lines;
}

/**
 * Process a template with given variables
 */
export function processTemplate(
  template: PromptTemplate,
  inputVariables: Record<string, unknown>,
  options: ProcessorOptions = {}
): ProcessedPrompt {
  const { resolved, warnings } = resolveVariables(template, inputVariables, options);
  
  const lines: string[] = [];
  
  for (const section of template.sections) {
    lines.push(...processSection(section, resolved, inputVariables));
  }
  
  const text = lines.join('\n');
  const hash = hashVariables(inputVariables);
  
  return {
    text,
    template: {
      id: template.id,
      version: template.version,
      type: template.type as PromptTemplateType,
    },
    hash,
    resolvedVariables: resolved,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Build a visualization prompt from a Payload.
 * Optionally pass an explicit template; defaults to the active visualization template.
 */
export function buildVisualizationPromptFromTemplate(
  config: Record<string, unknown>,
  options: ProcessorOptions = {},
  template?: PromptTemplate
): ProcessedPrompt {
  const tmpl = template ?? getActiveTemplate('visualization');
  
  // Prepare variables from config
  const variables: Record<string, unknown> = {
    shower_shape: config.shower_shape,
    enclosure_type: config.enclosure_type,
    glass_style: config.glass_style,
    hardware_finish: config.hardware_finish,
    handle_style: config.handle_style,
    track_preference: config.track_preference,
    door_type_description: config.door_type_description,
    glass_style_description: config.glass_style_description,
    hardware_finish_description: config.hardware_finish_description,
    handle_style_description: config.handle_style_description,
    framing_description: config.framing_description,
  };
  
  // Add hinged config if present
  //
  // UI convention (apps/gatsby-glass/components/wizard/EnclosureTypeStep.tsx):
  //   "Swing Left"  → direction='left'  → "Hinges on the LEFT,  swings out to the left"
  //   "Swing Right" → direction='right' → "Hinges on the RIGHT, swings out to the right"
  //   "Double Door" → direction='double' → "Hinges on outside edges, opens from the middle"
  //
  // We MUST expand 'left'/'right' into unambiguous side-specific clauses before
  // sending to the AI — passing the bare word "left" is genuinely ambiguous
  // (could mean hinge-side or swing-target-side).
  const hingedConfig = config.hinged_config as Record<string, unknown> | undefined;
  if (hingedConfig) {
    variables.hinged_to_ceiling = hingedConfig.to_ceiling ? 'Yes' : 'No';
    const hDir = String(hingedConfig.direction || '');
    if (hDir === 'double') {
      variables.hinged_direction = 'double / french-door pair (TWO doors hinged on opposite walls, meeting in the center)';
      variables.hinged_hinge_axis = 'EACH door hinges on its OUTER (wall-side) vertical edge — the LEFT door has side-mounted hinges along its LEFT edge anchored to the LEFT wall; the RIGHT door has side-mounted hinges along its RIGHT edge anchored to the RIGHT wall. NEVER pivot mechanism, NEVER top track, NEVER hinges in the center where the doors meet.';
      variables.hinged_handle_position = "EACH door has its handle on its INNER (center-facing) vertical edge — the LEFT door's handle on its RIGHT edge, the RIGHT door's handle on its LEFT edge — so the two handles sit next to each other at the center seam where the doors meet.";
      variables.hinged_count = 'two doors';
      variables.hinged_is_double = 'true';
    } else if (hDir === 'left') {
      variables.hinged_direction = 'swing left (hinges on the LEFT vertical edge of the door panel; the door swings OUTWARD to the left, away from the shower, when opened)';
      variables.hinged_hinge_axis = 'side-mounted hinges along the LEFT vertical edge of the door panel ONLY (NEVER pivot mechanism, NEVER top track, NEVER hinges on the RIGHT edge, NEVER hinges on both sides)';
      variables.hinged_handle_position = 'on the RIGHT vertical edge of the door panel (the edge OPPOSITE the LEFT-side hinges)';
      variables.hinged_count = 'one door';
      variables.hinged_is_double = 'false';
    } else if (hDir === 'right') {
      variables.hinged_direction = 'swing right (hinges on the RIGHT vertical edge of the door panel; the door swings OUTWARD to the right, away from the shower, when opened)';
      variables.hinged_hinge_axis = 'side-mounted hinges along the RIGHT vertical edge of the door panel ONLY (NEVER pivot mechanism, NEVER top track, NEVER hinges on the LEFT edge, NEVER hinges on both sides)';
      variables.hinged_handle_position = 'on the LEFT vertical edge of the door panel (the edge OPPOSITE the RIGHT-side hinges)';
      variables.hinged_count = 'one door';
      variables.hinged_is_double = 'false';
    } else {
      // Defensive fallback for any unrecognized value.
      variables.hinged_direction = hDir.replace('_', ' ');
      variables.hinged_hinge_axis = 'side-mounted hinges along ONE vertical edge of the door panel (NEVER pivot mechanism, NEVER top track)';
      variables.hinged_handle_position = 'on the OPPOSITE vertical edge from the hinges';
      variables.hinged_count = 'one door';
      variables.hinged_is_double = 'false';
    }
    variables.hinged_height = hingedConfig.to_ceiling
      ? 'floor to ceiling — glass extends to the top wall plane with no gap above'
      : 'standard 76-78 inch door height with open space above the glass';
  }

  // Add pivot config if present
  //
  // The UI reuses `directionOptions` for pivot doors, so 'left' and 'right' carry
  // the same orientation semantics as hinged — except the mechanism is an offset
  // pivot axis, not side-mounted hinges. We translate them analogously.
  const pivotConfig = config.pivot_config as Record<string, unknown> | undefined;
  if (pivotConfig) {
    const pDir = String(pivotConfig.direction || '');
    if (pDir === 'double') {
      variables.pivot_direction = 'double / french-pivot pair (TWO pivot doors, each pivoting from its own wall-side, meeting in the center)';
      variables.pivot_axis = 'EACH door has its own vertical pivot axis offset 4-6 inches IN from its OUTER (wall-side) edge — the LEFT door pivots near its LEFT edge, the RIGHT door pivots near its RIGHT edge. Two pivot points per door (top and bottom). NEVER center pivot, NEVER side hinges, NEVER top track.';
      variables.pivot_handle_position = "EACH door has its handle on its INNER (center-facing) edge — the LEFT door's handle on its RIGHT edge, the RIGHT door's handle on its LEFT edge — so the two handles sit next to each other at the center where the doors meet.";
      variables.pivot_count = 'two doors';
      variables.pivot_is_double = 'true';
    } else if (pDir === 'left') {
      variables.pivot_direction = 'pivot left (vertical pivot axis on the LEFT side, offset 4-6 inches IN from the LEFT edge of the door panel)';
      variables.pivot_axis = 'vertical pivot axis on the LEFT side of the door panel, offset 4-6 inches IN from the LEFT vertical edge (NOT center, NOT side hinges, NOT on the right side); two pivot points only — top and bottom — both anchored on this same LEFT-side axis';
      variables.pivot_handle_position = 'on the RIGHT side of the door panel (the side OPPOSITE the LEFT-side pivot axis) for natural operation';
      variables.pivot_count = 'one door';
      variables.pivot_is_double = 'false';
    } else if (pDir === 'right') {
      variables.pivot_direction = 'pivot right (vertical pivot axis on the RIGHT side, offset 4-6 inches IN from the RIGHT edge of the door panel)';
      variables.pivot_axis = 'vertical pivot axis on the RIGHT side of the door panel, offset 4-6 inches IN from the RIGHT vertical edge (NOT center, NOT side hinges, NOT on the left side); two pivot points only — top and bottom — both anchored on this same RIGHT-side axis';
      variables.pivot_handle_position = 'on the LEFT side of the door panel (the side OPPOSITE the RIGHT-side pivot axis) for natural operation';
      variables.pivot_count = 'one door';
      variables.pivot_is_double = 'false';
    } else {
      variables.pivot_direction = pDir.replace('_', ' ');
      variables.pivot_axis = 'vertical pivot axis offset 4-6 inches from one edge (NOT center, NOT side hinges); two pivot points only — top and bottom';
      variables.pivot_handle_position = 'on the side OPPOSITE the offset pivot for natural operation';
      variables.pivot_count = 'one door';
      variables.pivot_is_double = 'false';
    }
  }

  // Add sliding config if present
  // NOTE: The form sets `configuration` ('single' | 'double'), not `sub_type`.
  // Falling back to `sub_type` for older payloads, but `configuration` is canonical.
  //
  // UI hints (slidingDirectionOptions):
  //   'left'  → "Inner door slides LEFT,  outer door stays fixed"
  //   'right' → "Inner door slides RIGHT, outer door stays fixed"
  // Slide direction has limited visual impact when the door is rendered CLOSED,
  // but we still expand it so the AI knows which panel is moving and where its
  // handle should appear on the leading edge.
  const slidingConfig = config.sliding_config as Record<string, unknown> | undefined;
  if (slidingConfig) {
    const slidingCfg = String(slidingConfig.configuration || slidingConfig.sub_type || 'single');
    if (slidingCfg === 'double') {
      variables.sliding_type = 'double bypass (two sliding panels meeting in the center when closed)';
      variables.sliding_count = 'two glass panels';
      variables.sliding_is_double = 'true';
    } else {
      variables.sliding_type = 'single sliding panel against a fixed return panel';
      variables.sliding_count = 'one sliding glass panel plus one fixed glass panel';
      variables.sliding_is_double = 'false';
    }
    const sDir = String(slidingConfig.direction || '');
    if (sDir === 'left') {
      variables.sliding_direction = 'slides LEFT — the inner (front) moving panel travels LEFTWARD on the top track when opened; the fixed (back) panel sits on the LEFT side behind the moving panel; the moving panel\'s handle is positioned on its LEFT (leading) outer edge';
    } else if (sDir === 'right') {
      variables.sliding_direction = 'slides RIGHT — the inner (front) moving panel travels RIGHTWARD on the top track when opened; the fixed (back) panel sits on the RIGHT side behind the moving panel; the moving panel\'s handle is positioned on its RIGHT (leading) outer edge';
    } else {
      variables.sliding_direction = sDir.replace('_', ' ');
    }
  }
  
  return processTemplate(tmpl, variables, options);
}

/**
 * Build an inspiration prompt from shower shape.
 * Optionally pass an explicit template; defaults to the active inspiration template.
 */
export function buildInspirationPromptFromTemplate(
  showerShape: string,
  options: ProcessorOptions = {},
  template?: PromptTemplate
): ProcessedPrompt {
  const tmpl = template ?? getActiveTemplate('inspiration');
  
  return processTemplate(tmpl, { shower_shape: showerShape }, options);
}

/**
 * Get the system prompt.
 * Optionally pass an explicit template; defaults to the active system template.
 */
export function getSystemPromptFromTemplate(
  options: ProcessorOptions = {},
  template?: PromptTemplate
): ProcessedPrompt {
  const tmpl = template ?? getActiveTemplate('system');
  
  return processTemplate(tmpl, {}, options);
}

/**
 * Get the validation prompt.
 * Optionally pass an explicit template; defaults to the active validation template.
 */
export function getValidationPromptFromTemplate(
  options: ProcessorOptions = {},
  template?: PromptTemplate
): ProcessedPrompt {
  const tmpl = template ?? getActiveTemplate('validation');
  
  return processTemplate(tmpl, {}, options);
}
