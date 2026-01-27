# JSON-Based Prompting System - Usage Examples

## Example 1: Generate a Visualization Prompt

### Code

```typescript
import { buildVisualizationPrompt } from '@repo/visualizer-core/utils/promptBuilder';
import type { Payload } from '@repo/types';

const config: Payload = {
  mode: 'configure',
  image_ref: 'bathroom_001.jpg',
  enclosure_type: 'hinged',
  shower_shape: 'standard',
  glass_style: 'low_iron',
  hardware_finish: 'brushed_nickel',
  handle_style: 'ladder',
  track_preference: 'frameless',
  door_opening: { type: 'hinged', side: 'left', swing: 'out' },
  hinged_config: {
    to_ceiling: true,
    direction: 'swing_left'
  },
  optional: {
    glass_height: 'standard',
    custom_height_in: 0,
    towel_bar: { enabled: false, style: null }
  },
  user_notes: '',
  session_id: 'test_session_123',
  catalog_version: '1.0'
};

const prompt = buildVisualizationPrompt(config);
console.log(prompt);
```

### Generated Output

```
Create a photorealistic visualization of a custom shower glass installation with the following specifications:

SHOWER TYPE: standard shower
DOOR TYPE: Hinged Door
GLASS: Low Iron
HARDWARE FINISH: Brushed Nickel
HANDLE STYLE: Ladder Pull
FRAMING: Frameless

HINGED CONFIGURATION:
- Extends to ceiling: Yes
- Direction: swing left

CRITICAL RENDERING INSTRUCTIONS:
1. Maintain the exact lighting, color temperature, and ambiance of the original bathroom
2. Preserve all architectural details, tile work, fixtures, and decor
3. The shower glass must appear crystal clear and premium quality
4. Hardware (hinges, handles, tracks) must be precisely rendered in Brushed Nickel
5. Handle style should be clearly visible as Ladder Pull
6. The installation must look professionally done and seamlessly integrated
7. Only modify the shower enclosure - all other elements remain unchanged
8. The result should be indistinguishable from a professional installation photograph

Generate the image maintaining photorealistic quality with accurate material properties and lighting.
```

## Example 2: Using the Metadata API

```typescript
import { buildVisualizationPromptWithMetadata } from '@repo/visualizer-core/utils/promptBuilder';

const result = buildVisualizationPromptWithMetadata(config);

console.log('Prompt Text:', result.text);
console.log('Template ID:', result.template.id);
console.log('Template Version:', result.template.version);
console.log('Hash:', result.hash);
console.log('Resolved Variables:', result.resolvedVariables);

// Output:
// Prompt Text: Create a photorealistic visualization...
// Template ID: visualization-v1
// Template Version: 1.0.0
// Hash: abc123xyz
// Resolved Variables: { shower_shape: 'standard', enclosure_type_name: 'Hinged Door', ... }
```

## Example 3: Cache Statistics

```typescript
import { 
  getCacheStats, 
  getMostUsedPrompts,
  getRecentPrompts 
} from '@repo/prompt-templates';

// Get overall statistics
const stats = getCacheStats();
console.log(`Total Prompts: ${stats.totalPrompts}`);
console.log(`Total Uses: ${stats.totalUses}`);
console.log('By Type:', stats.byType);

// Get most popular prompts
const popular = getMostUsedPrompts(5);
popular.forEach(p => {
  console.log(`${p.templateId} v${p.templateVersion}: ${p.useCount} uses`);
});

// Get recent prompts
const recent = getRecentPrompts(5);
recent.forEach(p => {
  console.log(`${p.templateId}: Last used ${p.lastUsedAt}`);
});
```

## Example 4: Editing a Template

### Before Editing

**File**: `packages/prompt-templates/templates/visualization-v1.json`

```json
{
  "sections": [
    {
      "id": "instructions",
      "content": [
        "CRITICAL RENDERING INSTRUCTIONS:",
        "1. Maintain the exact lighting, color temperature, and ambiance",
        "2. Preserve all architectural details, tile work, fixtures, and decor"
      ]
    }
  ]
}
```

### After Editing

```json
{
  "sections": [
    {
      "id": "instructions",
      "content": [
        "CRITICAL RENDERING INSTRUCTIONS:",
        "1. Maintain the exact lighting, color temperature, and ambiance",
        "2. Preserve all architectural details, tile work, fixtures, and decor",
        "3. Ensure glass reflections appear realistic and natural"
      ]
    }
  ]
}
```

### Result

The next time `buildVisualizationPrompt()` is called, it will automatically include:

```
3. Ensure glass reflections appear realistic and natural
```

## Example 5: Inspiration Prompt

```typescript
import { buildInspirationPrompt } from '@repo/visualizer-core/utils/promptBuilder';

const prompt = buildInspirationPrompt('neo_angle');
console.log(prompt);
```

### Output

```
Analyze the inspiration image and recreate the shower glass style in the target bathroom photo.

TARGET SHOWER TYPE: neo_angle

INSTRUCTIONS:
1. Identify the door type, glass style, hardware finish, and overall aesthetic from the inspiration photo
2. Apply the same style, finishes, and design elements to the target bathroom
3. Adapt the design to fit the target bathroom's specific layout and dimensions
4. Maintain the lighting and ambiance of the target bathroom
5. Ensure the result looks professionally installed and matches the inspiration's premium quality
6. Only modify the shower enclosure in the target photo - preserve everything else

The goal is to show the customer how the inspiration design would look in their actual bathroom.
```

## Example 6: System Prompt

```typescript
import { getSystemPromptFromTemplate } from '@repo/prompt-templates';

const systemPrompt = getSystemPromptFromTemplate();
console.log(systemPrompt.text);
```

### Output

```
You are an AI image generation assistant for Gatsby Glass, a high-end shower glass company.
Your task is to create photorealistic visualizations of custom shower glass installations.

CRITICAL REQUIREMENTS:
1. Generate images that look like professional architectural photography
2. Match the lighting, perspective, and style of the input bathroom photo
3. The shower glass must look crystal clear and premium quality
4. Hardware (handles, hinges) must be accurately rendered in the specified finish
5. The result should be indistinguishable from a real installation photo
6. Maintain all architectural details of the original bathroom
7. Only modify the shower enclosure area - everything else stays the same
```

## Example 7: Custom Processing

```typescript
import { 
  processTemplate, 
  getActiveTemplate 
} from '@repo/prompt-templates';

const template = getActiveTemplate('visualization');

const result = processTemplate(template, {
  shower_shape: 'tub',
  enclosure_type: 'sliding',
  glass_style: 'clear',
  hardware_finish: 'chrome',
  handle_style: 'd_pull',
  track_preference: 'semi_frameless',
  sliding_type: 'double door',
  sliding_direction: 'sliding left'
}, {
  strictValidation: true,
  transformers: {
    shower_shape: (val) => String(val).toUpperCase()
  }
});

console.log(result.text);
console.log('Warnings:', result.warnings);
```

## Example 8: Export/Import Cache

```typescript
import { exportCache, importCache } from '@repo/prompt-templates';

// Export cache to file
const cacheJson = exportCache();
const fs = require('fs');
fs.writeFileSync('./prompt-cache.json', cacheJson);

// Later, import from file
const importedJson = fs.readFileSync('./prompt-cache.json', 'utf8');
const count = importCache(importedJson);
console.log(`Imported ${count} cached prompts`);
```

## Example 9: Clear Old Cache

```typescript
import { clearOldPrompts, getCacheStats } from '@repo/prompt-templates';

// Before cleanup
const beforeStats = getCacheStats();
console.log(`Total prompts before: ${beforeStats.totalPrompts}`);

// Clear prompts older than 7 days
const sevenDays = 7 * 24 * 60 * 60 * 1000;
const cleared = clearOldPrompts(sevenDays);
console.log(`Cleared ${cleared} old prompts`);

// After cleanup
const afterStats = getCacheStats();
console.log(`Total prompts after: ${afterStats.totalPrompts}`);
```

## Example 10: Adding a New Variable

### Step 1: Define Variable in Template

**File**: `visualization-v1.json`

```json
{
  "variables": [
    // ... existing variables ...
    {
      "name": "special_features",
      "type": "string",
      "required": false,
      "default": "",
      "description": "Special features or customizations"
    }
  ]
}
```

### Step 2: Use Variable in Content

```json
{
  "sections": [
    {
      "id": "special_features_section",
      "type": "custom",
      "condition": {
        "variable": "special_features",
        "operator": "exists"
      },
      "content": [
        "",
        "SPECIAL FEATURES:",
        "{{special_features}}"
      ]
    }
  ]
}
```

### Step 3: Pass Variable in Code

```typescript
const result = buildVisualizationPromptFromTemplate({
  // ... other config ...
  special_features: "Include decorative etching pattern"
});
```

## Testing the System

### Run Dev Server

```bash
pnpm dev
```

Visit: http://localhost:3001

### Test in Browser

1. Upload a bathroom image
2. Configure shower options
3. Click "Visualize"
4. The system will use the JSON-based prompts automatically

### Check Console

Open browser console to see:
- Generated prompt text
- Template version used
- Cache statistics

## Summary

The JSON-based prompting system provides:

- ✅ **Backward Compatible**: Old API still works
- ✅ **Easy to Edit**: Just edit JSON files
- ✅ **Type Safe**: Full TypeScript support
- ✅ **Cached**: Automatic prompt caching
- ✅ **Versioned**: Track all changes
- ✅ **Flexible**: Variables and conditions

Start using it today! All existing code continues to work, with the added benefit of JSON-based templates behind the scenes.
