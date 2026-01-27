# Architecture Migration Checklist

## Goal
Separate brand-specific code (Gatsby Glass products) from shared/reusable code (template system, AI handlers).

## Files Moved

### ✅ Completed
- [x] `packages/prompt-templates/src/option-descriptions.ts` → `apps/gatsby-glass/prompts/gatsby-options.ts`
- [x] `packages/prompt-templates/templates/` → `apps/gatsby-glass/prompts/templates/`
- [x] `packages/constants/` (copied to) → `apps/gatsby-glass/lib/gatsby-constants/`
- [x] `packages/types/src/visualizer.ts` (copied to) → `apps/gatsby-glass/lib/gatsby-types.ts`

## Files That Need Updating

### packages/prompt-templates/
- [ ] `src/templates.ts` - Remove hardcoded templates, make them loadable
- [ ] `src/processor.ts` - Remove imports of gatsby-options, accept as parameters
- [ ] `src/index.ts` - Update exports
- [ ] Remove `templates/` directory (already moved)

### apps/gatsby-glass/
- [ ] Create `prompts/index.ts` - Export gatsby templates and options
- [ ] Create `lib/index.ts` - Export gatsby constants and types
- [ ] Update `package.json` - Add internal exports

### Components Using Old Imports
- [ ] `apps/gatsby-glass/components/GatsbyGlassVisualizer.tsx`
  - Change: `import { CATALOG } from '@repo/constants'`
  - To: `import { CATALOG } from '../lib/gatsby-constants'`
  
- [ ] `apps/gatsby-glass/components/*.tsx` (check all)
  - Update any imports from `@repo/constants`
  - Update any imports from `@repo/types` (if using visualizer types)

### packages/visualizer-core/
- [ ] `src/utils/promptBuilder.ts`
  - Change: `import { CATALOG } from '@repo/constants'`
  - To: Accept catalog as parameter (make generic)
  
- [ ] Make all utilities accept configurations rather than import them

### packages/types/
- [ ] Remove `src/visualizer.ts` (moved to gatsby-glass)
- [ ] Keep only truly shared types:
  - `api.ts` - API request/response types
  - `leads.ts` - Lead submission types
  - Generic `ImageData`, etc.

### packages/constants/
- [ ] **Delete entire package** - it's brand-specific
  - All imports should be from `apps/gatsby-glass/lib/gatsby-constants`

### packages/api-handlers/
- [ ] `src/gemini.ts`
  - Currently imports `@repo/prompt-templates` - this is OK (shared)
  - Make sure it doesn't import brand-specific stuff

## Import Path Changes

| Old Path | New Path | Reason |
|----------|----------|--------|
| `@repo/constants` | `../lib/gatsby-constants` (in gatsby-glass) | Brand-specific |
| `@repo/types` (visualizer types) | `../lib/gatsby-types` (in gatsby-glass) | Brand-specific |
| `@repo/prompt-templates` (templates) | `../prompts` (in gatsby-glass) | Brand-specific |
| `@repo/prompt-templates` (system) | Keep as-is | Shared system |

## New Structure

```
packages/
├── api-handlers/          # ✅ Shared - Generic AI/API
├── prompt-templates/      # ✅ Shared - Generic template engine
├── types/                 # ⚠️ Needs cleanup - Remove brand types
├── visualizer-core/       # ⚠️ Needs cleanup - Make generic
└── constants/             # ❌ DELETE - All brand-specific

apps/gatsby-glass/
├── lib/
│   ├── gatsby-constants/  # ✅ Gatsby Glass products
│   └── gatsby-types.ts    # ✅ Gatsby Glass types
├── prompts/
│   ├── gatsby-options.ts  # ✅ Product descriptions
│   ├── templates/         # ✅ Prompt templates
│   └── index.ts           # 📝 TODO: Export everything
└── components/            # ⚠️ Update imports
```

## Testing After Migration

### 1. Verify Builds
```bash
cd apps/gatsby-glass
pnpm typecheck  # Should pass
pnpm build      # Should succeed
```

### 2. Verify App Works
- [ ] Upload bathroom image (validation)
- [ ] Select door type, glass, hardware
- [ ] Generate visualization
- [ ] Check prompt includes detailed descriptions

### 3. Verify Shared Packages
```bash
cd packages/prompt-templates
pnpm typecheck  # Should pass (no brand dependencies)

cd packages/api-handlers  
pnpm typecheck  # Should pass (no brand dependencies)
```

## Priority Order

1. **High Priority** (Breaks build)
   - Update imports in `GatsbyGlassVisualizer.tsx`
   - Create exports in `apps/gatsby-glass/prompts/index.ts`
   - Update `promptBuilder.ts` to use new paths

2. **Medium Priority** (Clean architecture)
   - Remove brand code from `packages/types`
   - Make `visualizer-core` generic
   - Update all component imports

3. **Low Priority** (Nice to have)
   - Delete `packages/constants` package
   - Add tests for shared packages
   - Document APIs

## Rollback Plan

If migration breaks:
1. Revert moved files back to original locations
2. Git reset to previous commit
3. Keep ARCHITECTURE.md for future reference

## Success Criteria

- ✅ Build succeeds: `pnpm build` (in gatsby-glass)
- ✅ App works: Can generate visualizations
- ✅ Shared packages have no brand dependencies
- ✅ Easy to add new brand: Just create new app folder
- ✅ Prompts are editable in gatsby-glass folder
