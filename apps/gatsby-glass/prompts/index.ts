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

// Brand-specific TypeScript template objects (canonical source for the processor)
export {
  visualizationTemplate,
  inspirationTemplate,
  systemTemplate,
  validationTemplate,
  gatsbyGlassRegistry,
  gatsbyGlassTemplates,
} from './gatsby-templates';

// Legacy JSON template re-exports (kept for reference / tooling)
export { default as visualizationTemplateJson } from './templates/visualization-v1.json';
export { default as inspirationTemplateJson } from './templates/inspiration-v1.json';
export { default as systemTemplateJson } from './templates/system-v1.json';
export { default as validationTemplateJson } from './templates/validation-v1.json';
export { default as registryJson } from './templates/registry.json';
