# HPB Visualizer - Multi-Brand Architecture

## Overview

This monorepo supports multiple brands, each with their own products, services, and visualizer configurations. The architecture separates **shared/reusable code** from **brand-specific implementations**.

## Directory Structure

```
HPB_Visualizer/
├── packages/                    # SHARED CODE - Used by ALL brands
│   ├── api-handlers/           # AI/API integrations (Gemini, Supabase)
│   ├── prompt-templates/       # Generic prompt template system
│   ├── types/                  # Shared types (API, ImageData, etc.)
│   └── visualizer-core/        # Generic visualizer utilities
│
└── apps/                        # BRAND-SPECIFIC APPS
    └── gatsby-glass/           # Gatsby Glass brand
        ├── app/                # Next.js app routes
        ├── components/         # UI components
        ├── lib/                # Brand-specific code
        │   ├── gatsby-constants/  # Product catalog
        │   └── gatsby-types.ts    # Product types
        └── prompts/            # Brand-specific prompts
            ├── gatsby-options.ts  # Product descriptions
            └── templates/         # Prompt templates
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
  - Template processor
  - Variable interpolation
  - Conditional sections
  - Cache utilities
  - **NOT** the actual templates or product descriptions

- **`types`**: Shared types only
  - `ImageData`
  - `VisualizationRequest`
  - `ApiResponse`
  - **NOT** product types like `GlassStyle` or `EnclosureType`

- **`visualizer-core`**: Generic utilities
  - Image processing (resize, compress, base64)
  - Generic React hooks
  - **NOT** brand-specific business logic

### ✅ Brand Apps (`apps/gatsby-glass/`)

Put code here if it's **specific to Gatsby Glass**:

- **`lib/gatsby-constants/`**: Product catalog
  - Glass styles (clear, low_iron, p516)
  - Hardware finishes (chrome, brushed_nickel, etc.)
  - Door types (hinged, pivot, sliding)
  - Handle styles, framing options

- **`lib/gatsby-types.ts`**: Product types
  - `GlassStyle = 'clear' | 'low_iron' | 'p516'`
  - `HardwareFinish = 'chrome' | 'brushed_nickel' | ...`
  - `EnclosureType = 'hinged' | 'pivot' | 'sliding'`
  - Product configuration interfaces

- **`prompts/gatsby-options.ts`**: Product descriptions
  - How each door type looks
  - How each glass style appears
  - How each hardware finish should be rendered
  - Visual descriptions for AI

- **`prompts/templates/`**: Prompt templates
  - Visualization prompts
  - Inspiration prompts
  - System prompts
  - Validation prompts

- **`components/`**: Brand-specific UI
  - `GatsbyGlassVisualizer.tsx`
  - Product selectors
  - Custom layouts

## Example: Adding a New Brand

To add "AcmeBath" brand:

```
apps/
└── acmebath/
    ├── app/                    # Next.js routes
    ├── components/             # AcmeBath UI
    ├── lib/
    │   ├── acme-constants/    # AcmeBath's products
    │   └── acme-types.ts      # AcmeBath's product types
    └── prompts/
        ├── acme-options.ts    # AcmeBath's product descriptions
        └── templates/         # AcmeBath's prompt templates
```

AcmeBath would:
- Use the same `@repo/api-handlers` (Gemini, Supabase)
- Use the same `@repo/prompt-templates` (template engine)
- Define their own products (maybe bathtubs, vanities, tiles)
- Define their own types (`BathtubStyle`, `VanityFinish`, etc.)
- Create their own prompt templates

## Editing Prompts

### For Gatsby Glass

Edit these files to change how the AI understands products:

1. **Product Descriptions** (How AI visualizes each option)
   - `apps/gatsby-glass/prompts/gatsby-options.ts`
   - Edit `doorTypeDescriptions`, `glassStyleDescriptions`, etc.

2. **Prompt Templates** (Overall structure)
   - `apps/gatsby-glass/prompts/templates/*.json`
   - Edit sections, add instructions, change flow

3. **Product Catalog** (Display names, UI labels)
   - `apps/gatsby-glass/lib/gatsby-constants/src/catalog.ts`
   - Names shown in UI, short descriptions

### Template System (Shared)

Only edit these if changing how templates work for ALL brands:

- `packages/prompt-templates/src/processor.ts` - Template engine
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

Currently migrating from old structure to new architecture:

- ✅ Created `apps/gatsby-glass/prompts/` for brand prompts
- ✅ Created `apps/gatsby-glass/lib/` for brand code
- ✅ Moved option descriptions to gatsby-glass
- ✅ Moved templates to gatsby-glass
- ⏳ Need to update imports throughout codebase
- ⏳ Need to remove brand-specific code from packages
- ⏳ Need to make shared packages truly generic

## Next Steps

1. Update all imports to use new structure
2. Remove brand-specific code from `packages/constants`
3. Remove brand-specific types from `packages/types`
4. Update `packages/visualizer-core` to be generic
5. Create clean exports from gatsby-glass
6. Document API for each shared package
7. Add tests for shared packages
