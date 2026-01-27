# @repo/prompt-templates

JSON-based prompt template system for AI visualization generation.

## Overview

This package provides a structured, version-controlled approach to managing AI prompts through JSON templates. All prompts can be easily edited, tracked, and cached for optimal performance.

## Features

- **JSON Templates**: All prompts are defined in editable JSON files
- **Variable Interpolation**: Use `{{variable_name}}` placeholders
- **Catalog Lookups**: Automatically resolve IDs to display names
- **Conditional Sections**: Show/hide sections based on config values
- **Version Control**: Each template has an ID and semantic version
- **Prompt Caching**: Track and reuse frequently-used prompts
- **Type Safety**: Full TypeScript support

## Quick Start

### Using in Code

```typescript
import {
  buildVisualizationPromptFromTemplate,
  buildInspirationPromptFromTemplate,
  getSystemPromptFromTemplate,
  cachePrompt
} from '@repo/prompt-templates';

// Build a visualization prompt
const result = buildVisualizationPromptFromTemplate(payloadConfig);
console.log(result.text); // The generated prompt

// Cache for tracking/reuse
const stored = cachePrompt(result, payloadConfig);
console.log(`Prompt used ${stored.useCount} times`);
```

### Editing Prompts

All templates are in `packages/prompt-templates/templates/`:

- `visualization-v1.json` - Main visualization prompt
- `inspiration-v1.json` - Inspiration matching prompt
- `system-v1.json` - Gemini system prompt
- `validation-v1.json` - Image validation prompt
- `registry.json` - Active template registry

## Template Structure

### Basic Example

```json
{
  "id": "visualization-v1",
  "version": "1.0.0",
  "name": "Shower Visualization Prompt",
  "type": "visualization",
  "description": "Main prompt template for generating photorealistic shower glass visualizations",
  "sections": [
    {
      "id": "header",
      "type": "header",
      "content": [
        "Create a photorealistic visualization of a custom shower glass installation with the following specifications:"
      ]
    },
    {
      "id": "specifications",
      "type": "specifications",
      "content": [
        "",
        "SHOWER TYPE: {{shower_shape}} shower",
        "DOOR TYPE: {{enclosure_type_name}}",
        "GLASS: {{glass_style_name}}"
      ]
    }
  ],
  "variables": [
    {
      "name": "shower_shape",
      "type": "string",
      "required": true,
      "description": "The detected shower shape"
    },
    {
      "name": "enclosure_type_name",
      "type": "catalog_lookup",
      "catalog": "enclosureTypes",
      "catalogProperty": "name",
      "required": true
    }
  ],
  "metadata": {
    "createdAt": "2026-01-27T00:00:00.000Z",
    "updatedAt": "2026-01-27T00:00:00.000Z",
    "author": "Gatsby Glass Team",
    "tags": ["visualization", "shower", "photorealistic"]
  }
}
```

## How to Edit Prompts

### 1. Edit Content

Simply modify the `content` array in any section:

```json
{
  "id": "instructions",
  "type": "instructions",
  "content": [
    "CRITICAL RENDERING INSTRUCTIONS:",
    "1. Maintain the exact lighting and ambiance",
    "2. Preserve all architectural details",
    "3. NEW INSTRUCTION HERE"
  ]
}
```

### 2. Add Variables

Define variables in the `variables` array:

```json
{
  "name": "custom_note",
  "type": "string",
  "required": false,
  "default": "",
  "description": "Optional custom note from user"
}
```

Then use it in content with `{{custom_note}}`.

### 3. Add Conditional Sections

Show sections only when conditions are met:

```json
{
  "id": "hinged_config",
  "type": "configuration",
  "condition": {
    "variable": "enclosure_type",
    "operator": "equals",
    "value": "hinged"
  },
  "content": [
    "HINGED CONFIGURATION:",
    "- Direction: {{hinged_direction}}"
  ]
}
```

### 4. Catalog Lookups

Use catalog lookups to convert IDs to display names:

```json
{
  "name": "hardware_finish_name",
  "type": "catalog_lookup",
  "catalog": "hardwareFinishes",
  "catalogProperty": "name",
  "required": true
}
```

Available catalogs:
- `glassStyles`
- `hardwareFinishes`
- `enclosureTypes`
- `handleStyles`
- `trackPreferences`

## Variable Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Plain text value | `"standard"` |
| `boolean` | True/false (converted to Yes/No) | `true` → `"Yes"` |
| `number` | Numeric value | `72` |
| `catalog_lookup` | Resolve from catalog | `"chrome"` → `"Polished Chrome"` |
| `conditional` | Used in conditions | - |

## Conditional Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Variable equals value | `enclosure_type === "hinged"` |
| `not_equals` | Variable doesn't equal value | `glass_style !== "clear"` |
| `exists` | Variable is defined | `hinged_config` is not null |
| `not_exists` | Variable is undefined | `hinged_config` is null |
| `in` | Variable in array | `type` in `["hinged", "pivot"]` |
| `not_in` | Variable not in array | `type` not in `["sliding"]` |

## Caching API

### Get Statistics

```typescript
import { getCacheStats } from '@repo/prompt-templates';

const stats = getCacheStats();
console.log(`Total prompts: ${stats.totalPrompts}`);
console.log(`Total uses: ${stats.totalUses}`);
console.log(`By type:`, stats.byType);
```

### Most Used Prompts

```typescript
import { getMostUsedPrompts } from '@repo/prompt-templates';

const popular = getMostUsedPrompts(10);
popular.forEach(p => {
  console.log(`${p.templateId}: ${p.useCount} uses`);
});
```

### Export/Import Cache

```typescript
import { exportCache, importCache } from '@repo/prompt-templates';

// Export to JSON
const json = exportCache();
localStorage.setItem('promptCache', json);

// Import from JSON
const imported = importCache(json);
console.log(`Imported ${imported} prompts`);
```

### Clear Old Prompts

```typescript
import { clearOldPrompts } from '@repo/prompt-templates';

// Clear prompts older than 30 days
const thirtyDays = 30 * 24 * 60 * 60 * 1000;
const cleared = clearOldPrompts(thirtyDays);
console.log(`Cleared ${cleared} old prompts`);
```

## Versioning

When making significant changes:

1. **Minor Updates**: Edit existing template, increment version to `1.0.1`, `1.0.2`, etc.
2. **Major Changes**: Create new template file `visualization-v2.json`, update `registry.json`

### Creating a New Version

1. Copy existing template:
   ```bash
   cp visualization-v1.json visualization-v2.json
   ```

2. Update the new template:
   ```json
   {
     "id": "visualization-v2",
     "version": "2.0.0",
     "metadata": {
       "updatedAt": "2026-01-28T00:00:00.000Z",
       "notes": "Added new rendering instructions"
     }
   }
   ```

3. Update registry:
   ```json
   {
     "activeTemplates": {
       "visualization": "visualization-v2"
     },
     "templates": {
       "visualization-v2": {
         "path": "./visualization-v2.json",
         "version": "2.0.0",
         "active": true
       },
       "visualization-v1": {
         "path": "./visualization-v1.json",
         "version": "1.0.0",
         "active": false
       }
     }
   }
   ```

## Advanced Usage

### Custom Variable Transformers

```typescript
import { processTemplate, getTemplateById } from '@repo/prompt-templates';

const template = getTemplateById('visualization-v1');
const result = processTemplate(template, variables, {
  transformers: {
    shower_shape: (value) => String(value).toUpperCase()
  }
});
```

### Strict Validation

```typescript
const result = processTemplate(template, variables, {
  strictValidation: true
});

if (result.warnings) {
  console.warn('Validation warnings:', result.warnings);
}
```

### Disable Caching

```typescript
const result = processTemplate(template, variables, {
  enableCache: false
});
```

## Migration Guide

### From Old System

The old `buildVisualizationPrompt()` and `buildInspirationPrompt()` functions still work - they now use the JSON templates internally.

**Before:**
```typescript
import { buildVisualizationPrompt } from '@repo/visualizer-core/utils/promptBuilder';

const prompt = buildVisualizationPrompt(config);
```

**After (same result):**
```typescript
import { buildVisualizationPrompt } from '@repo/visualizer-core/utils/promptBuilder';

const prompt = buildVisualizationPrompt(config); // Uses JSON templates now
```

**New API (with metadata):**
```typescript
import { buildVisualizationPromptWithMetadata } from '@repo/visualizer-core/utils/promptBuilder';

const result = buildVisualizationPromptWithMetadata(config);
console.log(result.text); // The prompt
console.log(result.template.version); // Template version used
console.log(result.hash); // Hash for caching
```

## API Reference

### Core Functions

- `getActiveTemplate(type)` - Get active template for type
- `getTemplateById(id)` - Get specific template
- `getAllTemplates()` - Get all templates
- `getRegistry()` - Get template registry
- `processTemplate(template, variables, options)` - Process template with variables

### Convenience Builders

- `buildVisualizationPromptFromTemplate(config, options)` - Build visualization prompt
- `buildInspirationPromptFromTemplate(showerShape, options)` - Build inspiration prompt
- `getSystemPromptFromTemplate(options)` - Get system prompt
- `getValidationPromptFromTemplate(options)` - Get validation prompt

### Cache Functions

- `cachePrompt(processed, variables)` - Cache a processed prompt
- `getCachedPrompt(templateId, hash)` - Get cached prompt
- `getAllCachedPrompts()` - Get all cached prompts
- `getCachedPromptsByType(type)` - Get prompts by type
- `getMostUsedPrompts(limit)` - Get most used prompts
- `getRecentPrompts(limit)` - Get recently used prompts
- `clearCachedPrompt(templateId, hash)` - Clear specific prompt
- `clearAllCache()` - Clear all cached prompts
- `clearOldPrompts(maxAge)` - Clear old prompts
- `getCacheStats()` - Get cache statistics
- `exportCache()` - Export cache as JSON
- `importCache(json)` - Import cache from JSON

## Best Practices

1. **Keep templates readable**: Use clear section IDs and descriptions
2. **Version carefully**: Increment versions when making changes
3. **Document changes**: Use metadata notes to explain updates
4. **Test thoroughly**: Test prompts after editing templates
5. **Use conditionals**: Keep templates flexible with conditions
6. **Monitor cache**: Regularly check which prompts are most used
7. **Clean up**: Periodically clear old cached prompts

## Troubleshooting

### Template Not Found

Check `registry.json` to ensure the template is registered:
```json
{
  "activeTemplates": {
    "visualization": "visualization-v1"
  }
}
```

### Variable Not Resolved

- Ensure variable is defined in `variables` array
- Check variable name matches exactly (case-sensitive)
- For catalog lookups, verify the base variable exists

### Condition Not Working

- Verify the condition syntax is correct
- Check that the variable being tested exists
- Use `exists`/`not_exists` for optional variables

### TypeScript Errors

Run type checking:
```bash
cd packages/prompt-templates
pnpm typecheck
```

## License

Private - Gatsby Glass
