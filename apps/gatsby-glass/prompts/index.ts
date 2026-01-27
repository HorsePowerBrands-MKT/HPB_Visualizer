/**
 * Gatsby Glass Prompts
 * 
 * This module exports all prompt-related configurations for Gatsby Glass.
 * These are brand-specific and describe Gatsby Glass's products and services.
 */

// Product option descriptions (how AI should visualize each option)
export {
  doorTypeDescriptions,
  glassStyleDescriptions,
  hardwareFinishDescriptions,
  handleStyleDescriptions,
  framingDescriptions,
  getOptionDescription,
} from './gatsby-options';

// Prompt templates (moved from packages/prompt-templates/templates/)
// These will be loaded by the template system
export { default as visualizationTemplate } from './templates/visualization-v1.json';
export { default as inspirationTemplate } from './templates/inspiration-v1.json';
export { default as systemTemplate } from './templates/system-v1.json';
export { default as validationTemplate } from './templates/validation-v1.json';
export { default as registry } from './templates/registry.json';
