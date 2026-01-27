# JSON-Based Prompting System

## Overview

The HPB Visualizer now uses a **JSON-based prompt template system** that makes editing and managing AI prompts straightforward and transparent.

## What Changed

### Before
- Prompts were hardcoded in TypeScript files
- Difficult to edit without coding knowledge
- No version tracking or reuse analytics
- Changes required code changes

### After
- Prompts are in editable JSON files
- Easy to update by anyone familiar with JSON
- Version controlled with change tracking
- Automatic caching and reuse tracking
- No code changes needed to update prompts

## Quick Start

### 1. Finding Prompts

All prompts are in: `packages/prompt-templates/templates/`

```
templates/
├── visualization-v1.json    # Main product visualization prompt
├── inspiration-v1.json      # Style matching prompt
├── system-v1.json          # AI system instructions
├── validation-v1.json      # Image validation prompt
└── registry.json           # Which templates are active
```

### 2. Editing a Prompt

**Example**: Edit the visualization prompt

1. Open `packages/prompt-templates/templates/visualization-v1.json`
2. Find the section you want to change:

```json
{
  "id": "instructions",
  "type": "instructions",
  "content": [
    "CRITICAL RENDERING INSTRUCTIONS:",
    "1. Maintain the exact lighting, color temperature, and ambiance",
    "2. Preserve all architectural details, tile work, fixtures, and decor",
    "3. The shower glass must appear crystal clear and premium quality"
  ]
}
```

3. Edit the content:

```json
{
  "id": "instructions",
  "type": "instructions",
  "content": [
    "CRITICAL RENDERING INSTRUCTIONS:",
    "1. Maintain the exact lighting, color temperature, and ambiance",
    "2. Preserve all architectural details, tile work, fixtures, and decor",
    "3. The shower glass must appear crystal clear and premium quality",
    "4. NEW INSTRUCTION: Ensure realistic reflections on glass surfaces"
  ]
}
```

4. Save the file - changes take effect immediately (no restart needed in production)

### 3. Using Variables

Prompts support dynamic variables using `{{variable_name}}` syntax:

```json
{
  "content": [
    "SHOWER TYPE: {{shower_shape}} shower",
    "DOOR TYPE: {{enclosure_type_name}}",
    "GLASS: {{glass_style_name}}",
    "HARDWARE FINISH: {{hardware_finish_name}}"
  ]
}
```

These are automatically replaced with actual values when the prompt is generated.

### 4. Conditional Sections

Show content only when certain conditions are met:

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
    "- Extends to ceiling: {{hinged_to_ceiling}}",
    "- Direction: {{hinged_direction}}"
  ]
}
```

This section only appears when `enclosure_type` is "hinged".

## Common Editing Scenarios

### Scenario 1: Change Instructions

**Goal**: Update rendering instructions

**File**: `visualization-v1.json`

**Steps**:
1. Find the `instructions` section
2. Modify the `content` array
3. Save the file

### Scenario 2: Add New Product Feature

**Goal**: Add towel bar configuration to prompt

**File**: `visualization-v1.json`

**Steps**:
1. Add variable definition:
```json
{
  "name": "towel_bar_enabled",
  "type": "boolean",
  "required": false,
  "description": "Whether towel bar is enabled"
}
```

2. Add conditional section:
```json
{
  "id": "towel_bar_config",
  "type": "configuration",
  "condition": {
    "variable": "towel_bar_enabled",
    "operator": "equals",
    "value": true
  },
  "content": [
    "TOWEL BAR: Included in {{towel_bar_style}} style"
  ]
}
```

### Scenario 3: Update System Behavior

**Goal**: Change how the AI interprets requests

**File**: `system-v1.json`

**Steps**:
1. Modify the requirements in the `content` array
2. Save changes

### Scenario 4: Adjust Validation Rules

**Goal**: Make image validation more strict/lenient

**File**: `validation-v1.json`

**Steps**:
1. Update the guidelines in the `content` array
2. Adjust the description text

## Advanced Features

### Version Control

When making major changes, create a new version:

1. Copy `visualization-v1.json` to `visualization-v2.json`
2. Update the new file:
   ```json
   {
     "id": "visualization-v2",
     "version": "2.0.0"
   }
   ```
3. Update `registry.json`:
   ```json
   {
     "activeTemplates": {
       "visualization": "visualization-v2"
     }
   }
   ```

### Analytics

Check which prompts are used most frequently:

```typescript
import { getCacheStats, getMostUsedPrompts } from '@repo/prompt-templates';

// Get overall stats
const stats = getCacheStats();
console.log(`Total prompts cached: ${stats.totalPrompts}`);
console.log(`Total uses: ${stats.totalUses}`);

// Get most popular prompts
const popular = getMostUsedPrompts(10);
```

### Custom Transformers

Apply custom formatting to variables:

```typescript
import { processTemplate } from '@repo/prompt-templates';

const result = processTemplate(template, variables, {
  transformers: {
    shower_shape: (value) => value.toUpperCase(),
    price: (value) => `$${value.toFixed(2)}`
  }
});
```

## File Structure

```
packages/prompt-templates/
├── README.md              # Detailed documentation
├── package.json
├── tsconfig.json
├── src/
│   ├── types.ts          # TypeScript type definitions
│   ├── processor.ts      # Template processing logic
│   ├── cache.ts          # Caching utilities
│   └── index.ts          # Public exports
└── templates/
    ├── registry.json     # Active template registry
    ├── visualization-v1.json
    ├── inspiration-v1.json
    ├── system-v1.json
    └── validation-v1.json
```

## Variable Types Reference

| Type | Description | Example |
|------|-------------|---------|
| `string` | Plain text | `"standard"`, `"Polished Chrome"` |
| `boolean` | Yes/No | `true` → `"Yes"`, `false` → `"No"` |
| `number` | Numeric | `72`, `3.5` |
| `catalog_lookup` | Resolves from catalog | `"chrome"` → `"Polished Chrome"` |

## Conditional Operators Reference

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `enclosure_type === "hinged"` |
| `not_equals` | Not equal | `glass_style !== "clear"` |
| `exists` | Is defined | Variable has a value |
| `not_exists` | Is undefined | Variable is null/undefined |
| `in` | In array | `type` in `["hinged", "pivot"]` |
| `not_in` | Not in array | `type` not in `["sliding"]` |

## Available Catalogs

Use these for `catalog_lookup` variables:

- `glassStyles` - Clear, Low Iron, P516
- `hardwareFinishes` - Chrome, Brushed Nickel, Matte Black, etc.
- `enclosureTypes` - Hinged, Pivot, Sliding
- `handleStyles` - Ladder Pull, Square Pull, D Pull, Knob
- `trackPreferences` - Frameless, Semi-Frameless, Framed

## Testing Changes

After editing templates:

1. **Dev Environment**: Changes take effect on next request
2. **Production**: May need cache clear or restart depending on deployment

To verify changes:
```bash
# Run the dev server
pnpm dev

# Visit http://localhost:3001
# Test visualization generation with different configs
```

## Troubleshooting

### Issue: Changes Not Appearing

**Solution**: 
- Check file was saved correctly
- Verify JSON syntax is valid (use a JSON validator)
- In dev, trigger a new visualization to see changes

### Issue: Variable Not Working

**Solution**:
- Ensure variable is defined in `variables` array
- Check spelling matches exactly (case-sensitive)
- For catalog lookups, verify the base variable exists

### Issue: Condition Not Triggering

**Solution**:
- Verify condition syntax
- Check variable name and operator
- Use `exists`/`not_exists` for optional variables

### Issue: JSON Parse Error

**Solution**:
- Validate JSON syntax (use jsonlint.com or VSCode)
- Check for missing commas, brackets, or quotes
- Ensure strings are properly escaped

## Best Practices

1. **Test Thoroughly**: Test prompts after editing
2. **Keep Backups**: Version control is your friend
3. **Document Changes**: Use the `metadata.notes` field
4. **Be Specific**: Clear, specific instructions work best
5. **Use Sections**: Organize content into logical sections
6. **Leverage Conditionals**: Keep templates flexible
7. **Monitor Usage**: Check analytics to optimize prompts

## Examples

### Example 1: Simple Content Change

**Before**:
```json
"content": ["Generate a high-quality image"]
```

**After**:
```json
"content": ["Generate a photorealistic, high-quality image"]
```

### Example 2: Adding Context

**Before**:
```json
"content": [
  "HARDWARE FINISH: {{hardware_finish_name}}"
]
```

**After**:
```json
"content": [
  "HARDWARE FINISH: {{hardware_finish_name}}",
  "Note: Hardware should have realistic metallic reflections"
]
```

### Example 3: New Conditional Section

```json
{
  "id": "premium_features",
  "type": "custom",
  "condition": {
    "variable": "is_premium",
    "operator": "equals",
    "value": true
  },
  "content": [
    "PREMIUM FEATURES:",
    "- Enhanced glass clarity",
    "- Custom hardware placement",
    "- Professional installation details"
  ]
}
```

## Getting Help

- **Detailed Docs**: See `packages/prompt-templates/README.md`
- **Code Examples**: Check `packages/visualizer-core/src/utils/promptBuilder.ts`
- **Template Examples**: All templates in `packages/prompt-templates/templates/`

## Summary

The JSON-based prompting system provides:

✅ **Easy editing** - No coding required  
✅ **Version control** - Track all changes  
✅ **Analytics** - See which prompts work best  
✅ **Flexibility** - Variables and conditionals  
✅ **Transparency** - See exactly what's being sent to AI  
✅ **Maintainability** - Clean separation of prompts from code  

Start editing your prompts in `packages/prompt-templates/templates/` today!
