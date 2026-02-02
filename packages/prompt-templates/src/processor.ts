/**
 * Prompt Template Processor
 * 
 * Loads JSON templates and resolves them into final prompt strings.
 * Supports variable interpolation, catalog lookups, and conditional sections.
 */

import type {
  PromptTemplate,
  PromptTemplateType,
  TemplateSection,
  TemplateCondition,
  ProcessedPrompt,
  ProcessorOptions,
} from './types';

// Import templates from TypeScript definitions (better bundler compatibility)
import { templates, registryData } from './templates';

/**
 * Get the active template for a given type
 */
export function getActiveTemplate(type: PromptTemplateType): PromptTemplate {
  const templateId = registryData.activeTemplates[type];
  const template = templates[templateId];
  
  if (!template) {
    throw new Error(`No active template found for type: ${type}`);
  }
  
  return template;
}

/**
 * Get a template by its ID
 */
export function getTemplateById(id: string): PromptTemplate {
  const template = templates[id];
  
  if (!template) {
    throw new Error(`Template not found: ${id}`);
  }
  
  return template;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): PromptTemplate[] {
  return Object.values(templates);
}

/**
 * Get the template registry
 */
export function getRegistry() {
  return registryData;
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
 * Build a visualization prompt from a Payload
 */
export function buildVisualizationPromptFromTemplate(
  config: Record<string, unknown>,
  options: ProcessorOptions = {}
): ProcessedPrompt {
  const template = getActiveTemplate('visualization');
  
  // Prepare variables from config
  const variables: Record<string, unknown> = {
    shower_shape: config.shower_shape,
    enclosure_type: config.enclosure_type,
    glass_style: config.glass_style,
    hardware_finish: config.hardware_finish,
    handle_style: config.handle_style,
    track_preference: config.track_preference,
  };
  
  // Add hinged config if present
  const hingedConfig = config.hinged_config as Record<string, unknown> | undefined;
  if (hingedConfig) {
    variables.hinged_to_ceiling = hingedConfig.to_ceiling ? 'Yes' : 'No';
    variables.hinged_direction = String(hingedConfig.direction || '').replace('_', ' ');
  }
  
  // Add pivot config if present
  const pivotConfig = config.pivot_config as Record<string, unknown> | undefined;
  if (pivotConfig) {
    variables.pivot_direction = String(pivotConfig.direction || '').replace('_', ' ');
  }
  
  // Add sliding config if present
  const slidingConfig = config.sliding_config as Record<string, unknown> | undefined;
  if (slidingConfig) {
    variables.sliding_type = String(slidingConfig.sub_type || '').replace('_', ' ');
    variables.sliding_direction = String(slidingConfig.direction || '').replace('_', ' ');
  }
  
  return processTemplate(template, variables, options);
}

/**
 * Build an inspiration prompt from shower shape
 */
export function buildInspirationPromptFromTemplate(
  showerShape: string,
  options: ProcessorOptions = {}
): ProcessedPrompt {
  const template = getActiveTemplate('inspiration');
  
  return processTemplate(template, { shower_shape: showerShape }, options);
}

/**
 * Get the system prompt
 */
export function getSystemPromptFromTemplate(
  options: ProcessorOptions = {}
): ProcessedPrompt {
  const template = getActiveTemplate('system');
  
  return processTemplate(template, {}, options);
}

/**
 * Get the validation prompt
 */
export function getValidationPromptFromTemplate(
  options: ProcessorOptions = {}
): ProcessedPrompt {
  const template = getActiveTemplate('validation');
  
  return processTemplate(template, {}, options);
}
