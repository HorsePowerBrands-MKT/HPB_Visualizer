/**
 * @repo/prompt-templates
 * 
 * JSON-based prompt template system for AI visualization generation.
 * 
 * Features:
 * - JSON prompt templates for easy editing and version control
 * - Variable interpolation with catalog lookups
 * - Conditional sections based on configuration
 * - In-memory caching for prompt reuse
 * - Type-safe API
 * 
 * Usage:
 * 
 * ```typescript
 * import { 
 *   buildVisualizationPromptFromTemplate,
 *   buildInspirationPromptFromTemplate,
 *   getSystemPromptFromTemplate,
 *   cachePrompt
 * } from '@repo/prompt-templates';
 * 
 * // Build a visualization prompt
 * const result = buildVisualizationPromptFromTemplate(payloadConfig);
 * console.log(result.text); // The generated prompt
 * 
 * // Cache for reuse
 * const stored = cachePrompt(result, payloadConfig);
 * ```
 */

// Export types
export type {
  PromptTemplate,
  PromptTemplateType,
  TemplateSection,
  TemplateCondition,
  TemplateVariable,
  VariableType,
  StoredPrompt,
  ProcessedPrompt,
  ProcessorOptions,
  PromptTemplateRegistry,
} from './types';

// Export processor functions
export {
  // Template access
  getActiveTemplate,
  getTemplateById,
  getAllTemplates,
  getRegistry,
  
  // Core processing
  processTemplate,
  
  // Convenience builders (drop-in replacements for old promptBuilder)
  buildVisualizationPromptFromTemplate,
  buildInspirationPromptFromTemplate,
  getSystemPromptFromTemplate,
  getValidationPromptFromTemplate,
} from './processor';

// Export cache functions
export {
  cachePrompt,
  getCachedPrompt,
  getAllCachedPrompts,
  getCachedPromptsByType,
  getMostUsedPrompts,
  getRecentPrompts,
  clearCachedPrompt,
  clearAllCache,
  clearOldPrompts,
  getCacheStats,
  exportCache,
  importCache,
} from './cache';
