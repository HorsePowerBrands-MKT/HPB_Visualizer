# Project Cleanup Summary

## What Was Done

Separated **brand-specific code** (Gatsby Glass products) from **shared code** (reusable systems) to support multiple brands.

## Before (❌ Mixed Architecture)

```
packages/
├── prompt-templates/
│   ├── templates/                    # ❌ Gatsby Glass prompts in shared package
│   └── src/option-descriptions.ts   # ❌ Gatsby Glass products in shared package
├── constants/
│   └── src/catalog.ts               # ❌ Gatsby Glass products in shared package
└── types/
    └── src/visualizer.ts            # ❌ Gatsby Glass types in shared package

apps/
└── gatsby-glass/
    ├── app/                         # ✅ Next.js routes
    └── components/                  # ✅ UI components
```

**Problems:**
- Can't add new brands without modifying shared packages
- Gatsby Glass products mixed with generic code
- Unclear what's reusable vs. brand-specific

## After (✅ Clean Architecture)

```
packages/                            # 🌍 SHARED - Used by ALL brands
├── api-handlers/                   # ✅ Generic AI/API (Gemini, Supabase)
├── prompt-templates/               # ✅ Generic template engine
├── types/                          # ✅ Shared types only (ImageData, API types)
└── visualizer-core/                # ✅ Generic utilities

apps/gatsby-glass/                   # 🏢 GATSBY GLASS SPECIFIC
├── lib/                            # 📦 Product code
│   ├── gatsby-constants/          # Products catalog
│   ├── gatsby-types.ts            # Product types
│   └── index.ts                   # Exports
├── prompts/                        # 💬 Prompt configs
│   ├── gatsby-options.ts          # Product descriptions
│   ├── templates/                 # Prompt templates
│   └── index.ts                   # Exports
├── app/                            # 🌐 Next.js routes
└── components/                     # 🎨 UI components
```

**Benefits:**
- ✅ Easy to add new brands (just create new app)
- ✅ Clear separation: shared vs. brand-specific
- ✅ Gatsby Glass owns all their product definitions
- ✅ Shared code has no brand dependencies

## Files Moved

### 1. Product Descriptions
**From:** `packages/prompt-templates/src/option-descriptions.ts`  
**To:** `apps/gatsby-glass/prompts/gatsby-options.ts`  
**Why:** Describes Gatsby Glass specific products (door types, glass styles, hardware)

### 2. Prompt Templates
**From:** `packages/prompt-templates/templates/`  
**To:** `apps/gatsby-glass/prompts/templates/`  
**Why:** Gatsby Glass specific visualization prompts

### 3. Product Catalog
**From:** `packages/constants/src/catalog.ts`  
**To:** `apps/gatsby-glass/lib/gatsby-constants/src/catalog.ts`  
**Why:** Defines what products Gatsby Glass sells

### 4. Product Types
**From:** `packages/types/src/visualizer.ts`  
**To:** `apps/gatsby-glass/lib/gatsby-types.ts`  
**Why:** TypeScript types specific to Gatsby Glass products

## How to Edit Prompts Now

### ✏️ To Change Product Descriptions

**File:** `apps/gatsby-glass/prompts/gatsby-options.ts`

Example - editing how hinged doors are described:

```typescript
export const doorTypeDescriptions = {
  hinged: {
    name: "Hinged Door",
    description: `A HINGED GLASS DOOR that swings open on side-mounted hinges.
    CRITICAL VISUAL REQUIREMENTS:
    - The door must have visible HINGES on one side
    - Must be a FULL DOOR that closes completely
    - NOT a fixed glass panel...`
  }
}
```

### ✏️ To Change Prompt Templates

**Files:** `apps/gatsby-glass/prompts/templates/*.json`

Example - editing visualization prompt:

```json
{
  "sections": [
    {
      "id": "instructions",
      "content": [
        "REMOVE the existing shower glass completely",
        "INSTALL the new door as specified",
        "Add your new instruction here..."
      ]
    }
  ]
}
```

### ✏️ To Change Product Catalog

**File:** `apps/gatsby-glass/lib/gatsby-constants/src/catalog.ts`

Example - adding a new hardware finish:

```typescript
export const hardwareFinishes = {
  // ... existing finishes ...
  rose_gold: {
    name: 'Rose Gold',
    description: 'Warm rose-toned metallic finish'
  }
}
```

## Import Path Changes

| Old Import | New Import | Location |
|------------|------------|----------|
| `@repo/constants` | `../lib` or `./lib` | In gatsby-glass files |
| `@repo/types` (visualizer) | `../lib/gatsby-types` | In gatsby-glass files |
| Prompt templates | `../prompts/templates/` | In gatsby-glass files |

## What's Next

### ⏳ Still TODO

1. **Update component imports**
   - Change `GatsbyGlassVisualizer.tsx` to use new paths
   - Update other components that import from old locations

2. **Update visualizer-core**
   - Make `promptBuilder.ts` accept catalog as parameter
   - Remove hardcoded imports to `@repo/constants`

3. **Clean up shared packages**
   - Remove brand-specific code from `packages/types`
   - Consider removing `packages/constants` entirely

4. **Test everything**
   - Verify builds pass
   - Test image upload and visualization
   - Confirm prompts work correctly

### 🎯 Success Criteria

- [x] Files moved to correct locations
- [x] Export files created (`prompts/index.ts`, `lib/index.ts`)
- [ ] All imports updated
- [ ] Build succeeds
- [ ] App functions correctly
- [ ] Prompts editable in gatsby-glass folder

## Adding a New Brand

With this clean architecture, adding a new brand is simple:

```
apps/acmebath/                     # New brand!
├── lib/
│   ├── acme-constants/           # Their products
│   └── acme-types.ts             # Their types
├── prompts/
│   ├── acme-options.ts           # Their descriptions
│   └── templates/                # Their prompts
├── app/                          # Their Next.js app
└── components/                   # Their UI
```

AcmeBath automatically gets:
- ✅ AI integration (`@repo/api-handlers`)
- ✅ Template system (`@repo/prompt-templates`)
- ✅ Shared utilities (`@repo/visualizer-core`)
- ✅ Shared types (`@repo/types`)

## Questions?

See these docs:
- `ARCHITECTURE.md` - Full architecture explanation
- `MIGRATION_CHECKLIST.md` - Detailed migration steps
- `packages/prompt-templates/README.md` - Template system docs
