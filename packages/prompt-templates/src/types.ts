/**
 * JSON Prompt Template Types
 * 
 * This module defines the schema for JSON-based prompt templates.
 * Templates are structured, versioned, and easily editable.
 */

// Template types
export type PromptTemplateType = 'visualization' | 'inspiration' | 'validation' | 'system';

// Variable types supported in templates
export type VariableType = 'string' | 'boolean' | 'number' | 'catalog_lookup' | 'conditional';

/**
 * Variable definition in a template
 */
export interface TemplateVariable {
  /** Variable name used in template (e.g., "glass_style") */
  name: string;
  /** Type of the variable */
  type: VariableType;
  /** For catalog_lookup: which catalog to use */
  catalog?: 'glassStyles' | 'hardwareFinishes' | 'enclosureTypes' | 'handleStyles' | 'trackPreferences';
  /** Property to extract from catalog (default: "name") */
  catalogProperty?: string;
  /** Optional default value */
  default?: string | number | boolean;
  /** Description for documentation */
  description?: string;
  /** Whether this variable is required */
  required?: boolean;
}

/**
 * Condition for conditional sections
 */
export interface TemplateCondition {
  /** Variable to check */
  variable: string;
  /** Operator for comparison */
  operator: 'equals' | 'not_equals' | 'exists' | 'not_exists' | 'in' | 'not_in';
  /** Value to compare against (for equals/not_equals/in/not_in) */
  value?: string | number | boolean | (string | number | boolean)[];
}

/**
 * A section of the prompt template
 */
export interface TemplateSection {
  /** Section identifier */
  id: string;
  /** Type of section */
  type: 'header' | 'specifications' | 'configuration' | 'instructions' | 'custom';
  /** Optional condition for this section */
  condition?: TemplateCondition;
  /** Content lines (can include {{variable}} placeholders) */
  content: string[];
  /** Optional child sections (for nested conditionals) */
  children?: TemplateSection[];
}

/**
 * Complete prompt template structure
 */
export interface PromptTemplate {
  /** Unique template identifier */
  id: string;
  /** Semantic version */
  version: string;
  /** Human-readable name */
  name: string;
  /** Template type */
  type: PromptTemplateType;
  /** Description of what this template does */
  description: string;
  /** Template sections that build the prompt */
  sections: TemplateSection[];
  /** Variable definitions */
  variables: TemplateVariable[];
  /** Metadata */
  metadata: {
    /** ISO timestamp of creation */
    createdAt: string;
    /** ISO timestamp of last update */
    updatedAt: string;
    /** Author or team */
    author?: string;
    /** Tags for organization */
    tags?: string[];
    /** Notes about this version */
    notes?: string;
  };
}

/**
 * Registry of all available templates
 */
export interface PromptTemplateRegistry {
  /** Registry version */
  version: string;
  /** Last updated timestamp */
  updatedAt: string;
  /** Map of template type to active template ID */
  activeTemplates: Record<PromptTemplateType, string>;
  /** All available templates by ID */
  templates: Record<string, {
    /** Template file path */
    path: string;
    /** Template version */
    version: string;
    /** Whether this is the active template for its type */
    active: boolean;
  }>;
}

/**
 * Cached/stored prompt record
 */
export interface StoredPrompt {
  /** Unique ID for this prompt instance */
  id: string;
  /** Template ID used to generate this prompt */
  templateId: string;
  /** Template version used */
  templateVersion: string;
  /** Hash of the input variables (for deduplication) */
  inputHash: string;
  /** The input variables used */
  variables: Record<string, unknown>;
  /** The generated prompt text */
  promptText: string;
  /** When this prompt was generated */
  generatedAt: string;
  /** How many times this prompt has been used */
  useCount: number;
  /** Last time this prompt was used */
  lastUsedAt: string;
}

/**
 * Options for the prompt processor
 */
export interface ProcessorOptions {
  /** Whether to enable caching */
  enableCache?: boolean;
  /** Whether to validate variables strictly */
  strictValidation?: boolean;
  /** Custom variable transformers */
  transformers?: Record<string, (value: unknown) => string>;
  /** Product catalog for lookup variables (brand-specific) */
  catalog?: Record<string, any>;
}

/**
 * Result of processing a template
 */
export interface ProcessedPrompt {
  /** The final prompt text */
  text: string;
  /** The template used */
  template: {
    id: string;
    version: string;
    type: PromptTemplateType;
  };
  /** Hash for caching/deduplication */
  hash: string;
  /** Variables that were resolved */
  resolvedVariables: Record<string, string>;
  /** Any warnings during processing */
  warnings?: string[];
}
