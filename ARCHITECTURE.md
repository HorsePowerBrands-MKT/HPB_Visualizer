# HPB Visualizer - Multi-Brand Architecture

## Overview

This monorepo supports multiple brands, each with their own products, services, and visualizer configurations. The architecture separates **shared/reusable code** from **brand-specific implementations**.

## Directory Structure

```
HPB_Visualizer/
├── packages/                    # SHARED CODE - Used by ALL brands
│   ├── api-handlers/           # AI/API integrations (Gemini, Supabase)
│   ├── prompt-templates/       # Template engine + processor (no brand content)
│   ├── types/                  # Shared generic types + brand-compat re-exports
│   └── visualizer-core/        # Image utils, HEIC, base64 + brand-compat re-exports
│
├── apps/                        # BRAND-SPECIFIC APPS
│   └── gatsby-glass/           # Gatsby Glass brand
│       ├── app/                # Next.js app routes
│       ├── components/         # UI components
│       ├── hooks/              # Brand-specific React hooks
│       │   └── useVisualizerState.ts  # Shower wizard state
│       ├── lib/                # Brand-specific code
│       │   ├── gatsby-constants/  # Product catalog
│       │   ├── gatsby-types.ts    # Product types (canonical source)
│       │   └── promptBuilder.ts   # Brand prompt wrappers
│       └── prompts/            # Brand-specific prompts
│           ├── gatsby-options.ts     # Product descriptions for AI
│           ├── gatsby-templates.ts   # Prompt template objects
│           └── templates/            # JSON prompt templates (reference)
│
└── supabase/                    # Database migrations (per-brand tables)
    └── migrations/
```

## What Goes Where?

### ✅ Shared Packages (`packages/`)

Put code here if **ALL brands** will use it:

- **`api-handlers`**: Generic AI/API clients
  - Gemini API client
  - Supabase client
  - Image validation
  - Generic, not product-specific

- **`prompt-templates`**: Template engine
  - Template processor with variable interpolation
  - Conditional sections
  - Cache utilities
  - `registerBrandTemplates()` for brand template injection
  - **NOT** the actual templates or product descriptions

- **`types`**: Shared generic types + backward-compat re-exports
  - `ImageData`, `VisualizationRequest`, `APIError`
  - `GenericLead`, `GenericGenerationRecord`, `GenericVisualizationData`
  - `GenericImageValidationResponse`
  - Re-exports Gatsby Glass types for backward compatibility
  - **New brands** should use the `Generic*` types and define product types locally

- **`visualizer-core`**: Generic image utilities + backward-compat re-exports
  - Image processing (resize, compress, base64)
  - HEIC conversion
  - Re-exports shower-specific hook/builders for backward compatibility
  - **New brands** should only use image utilities and create their own hooks

### ✅ Brand Apps (`apps/gatsby-glass/`)

Put code here if it's **specific to Gatsby Glass**:

- **`lib/gatsby-types.ts`**: Product types (canonical source)
  - `GlassStyle = 'clear' | 'low_iron' | 'p516'`
  - `HardwareFinish = 'chrome' | 'brushed_nickel' | ...`
  - `EnclosureType = 'hinged' | 'pivot' | 'sliding'`
  - `Payload`, `Configs`, `HistoryItem`, `SavedDesign`

- **`lib/gatsby-constants/`**: Product catalog
  - Glass styles, hardware finishes, door types
  - Handle styles, framing options
  - Brand configuration (`GATSBY_GLASS_CONFIG`)

- **`lib/promptBuilder.ts`**: Prompt builder wrappers
  - `buildVisualizationPrompt(config)` - uses Payload type
  - `buildInspirationPrompt(showerShape)` - uses template engine

- **`hooks/useVisualizerState.ts`**: Wizard state hook
  - Shower glass product defaults
  - Neo-angle compatibility rules
  - 5-step configure / 3-step inspiration flow

- **`prompts/gatsby-options.ts`**: Product descriptions for AI
  - Door type, glass style, hardware, handle, framing descriptions

- **`prompts/gatsby-templates.ts`**: Prompt template objects
  - Visualization, inspiration, system, validation templates
  - Brand registry for template processor

- **`components/`**: Brand-specific UI
  - `GatsbyGlassVisualizer.tsx`
  - Product selectors, wizard steps
  - Custom layouts

## Example: Adding a New Brand

To add "Stand Strong Fencing" brand:

```
apps/
└── stand-strong-fencing/
    ├── app/                       # Next.js routes
    ├── components/                # SSF UI components
    ├── hooks/
    │   └── useVisualizerState.ts  # Fencing-specific wizard state
    ├── lib/
    │   ├── fencing-constants/     # Fence product catalog
    │   ├── fencing-types.ts       # FenceStyle, Material, Height, etc.
    │   └── promptBuilder.ts       # Brand prompt wrappers
    ├── prompts/
    │   ├── fencing-options.ts     # Fence product descriptions for AI
    │   ├── fencing-templates.ts   # Prompt template objects
    │   └── templates/             # JSON prompt templates
    ├── public/                    # Static assets (logos, fonts)
    ├── package.json               # @ssf/app with workspace deps
    └── vercel.json                # Per-brand deployment config
```

Stand Strong Fencing would:

- Import `@repo/api-handlers` (Gemini, Supabase clients)
- Import `@repo/prompt-templates` (template engine, `registerBrandTemplates()`)
- Import `@repo/visualizer-core` (image utils, HEIC conversion only)
- Import `@repo/types` (`GenericLead`, `GenericGenerationRecord`, `ImageData`, etc.)
- Define their own product types (`FenceStyle`, `Material`, `Height`, `Color`)
- Create their own prompt templates describing fence products
- Build their own wizard UI with fencing-specific steps

## Editing Prompts

### For Gatsby Glass

Edit these files to change how the AI understands products:

1. **Product Descriptions** (How AI visualizes each option)
   - `apps/gatsby-glass/prompts/gatsby-options.ts`
   - Edit `doorTypeDescriptions`, `glassStyleDescriptions`, etc.

2. **Prompt Templates** (Overall structure)
   - `apps/gatsby-glass/prompts/gatsby-templates.ts` (TypeScript objects used by processor)
   - `apps/gatsby-glass/prompts/templates/*.json` (JSON reference copies)
   - Edit sections, add instructions, change flow

3. **Product Catalog** (Display names, UI labels)
   - `apps/gatsby-glass/lib/gatsby-constants/src/catalog.ts`
   - Names shown in UI, short descriptions

### Template System (Shared)

Only edit these if changing how the template engine works for ALL brands:

- `packages/prompt-templates/src/processor.ts` - Template engine + `registerBrandTemplates()`
- `packages/prompt-templates/src/types.ts` - Template schema
- `packages/prompt-templates/src/cache.ts` - Caching logic

## Benefits of This Architecture

### ✅ For Multi-Brand Support
- Easy to add new brands without touching shared code
- Each brand has complete control over their products
- Shared code improvements benefit all brands

### ✅ For Maintainability
- Clear separation of concerns
- Changes to one brand don't affect others
- Shared utilities reduce duplication

### ✅ For Prompt Editing
- Brand teams can edit their own prompts
- No risk of breaking other brands
- Product descriptions are separate from template logic

### ✅ For Development
- Can work on one brand without touching others
- Clearer dependencies
- Easier onboarding for new developers

## Anti-Patterns to Avoid

❌ **Don't** put brand-specific code in `packages/`
- If it's specific to one brand's products → `apps/[brand]/`
- If it mentions specific glass styles, door types, etc. → `apps/[brand]/`

❌ **Don't** hardcode brand logic in shared packages
- Use dependency injection
- Accept configurations as parameters
- Keep packages generic

❌ **Don't** duplicate shared code in brand apps
- If multiple brands need it → `packages/`
- If it's truly generic → extract to shared package

## Migration Status

Multi-brand architecture migration is complete:

- ✅ Created `apps/gatsby-glass/lib/gatsby-types.ts` (canonical brand types)
- ✅ Created `apps/gatsby-glass/hooks/useVisualizerState.ts` (brand-specific wizard)
- ✅ Created `apps/gatsby-glass/lib/promptBuilder.ts` (brand prompt wrappers)
- ✅ Created `apps/gatsby-glass/prompts/gatsby-templates.ts` (brand template objects)
- ✅ Added `GenericLead`, `GenericGenerationRecord`, `GenericImageValidationResponse` to `@repo/types`
- ✅ Added `registerBrandTemplates()` to `@repo/prompt-templates`
- ✅ Shared packages re-export Gatsby Glass types for backward compatibility
- ✅ Removed stray `gg-branding-hub 2/` directory

### Backward Compatibility

Existing `import from '@repo/types'` and `import from '@repo/visualizer-core'` still work
for Gatsby Glass. The shared packages re-export brand-specific types and hooks. New brands
should use the `Generic*` types from `@repo/types` and define their own product types locally.

## Next Steps

1. Add tests for shared packages
2. Document API for each shared package
3. Add CI/CD for multi-brand builds (per-app Vercel projects)
4. Create first additional brand app (Stand Strong Fencing, Bumble Bee Blinds, etc.)
