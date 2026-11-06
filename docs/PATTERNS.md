# Patterns — HPB Visualizer

Recurring implementation patterns in the Gatsby Glass visualizer. For directory layout and package rules, see [ARCHITECTURE.md](../ARCHITECTURE.md).

## Wizard state (shower, railing, room enclosure)

- **Shower:** `apps/gatsby-glass/hooks/useVisualizerState.ts` — multi-step configure/inspiration flow, product defaults, neo-angle compatibility.
- **Railing:** `apps/gatsby-glass/hooks/useRailingVisualizerState.ts` (and `GatsbyRailingVisualizer.tsx`) — separate product line with its own steps and payload.
- **Room enclosure:** `apps/gatsby-glass/hooks/useRoomEnclosureVisualizerState.ts` (and `GatsbyRoomEnclosureVisualizer.tsx`) — framed / frameless glass rooms; same step contract as railing, with Room Type auto-detected from the photo.
- `GatsbyVisualizer.tsx` routes between modules via `?module=` (ids in `lib/productModules.ts`).
- State hooks own step index, selections, and uploaded image handles; they call API routes for generation — they do not call Gemini directly from the client.

## Product modules and the `product` discriminator

- Non-shower products tag every request with `product` (`'railing' | 'room_enclosure'`); absent = shower so the legacy flow is unchanged.
- `validate-image` picks the product's validation prompt + response shape; `generate-visualization` swaps in the product's system prompt and edit preamble; `save-visualization` / `submit-lead` store selections in `product_config` (JSONB) instead of new columns.
- Per-product rules + prompt text live in `lib/<module>/rules.ts` with an acceptance script under `scripts/check-*-rules.ts`.
- Hardware finishes for railing and room enclosure come from one catalog, `lib/metal-finishes.ts`.

## Prompt templates

- Brands register templates at startup: `registerBrandTemplates()` from `@repo/prompt-templates`.
- Gatsby definitions: `prompts/gatsby-templates.ts`, product copy in `prompts/gatsby-options.ts`.
- Server/build paths use `processTemplate` / `buildVisualizationPrompt` wrappers in `lib/promptBuilder.ts`.
- Template variables use `{{name}}` interpolation; catalog lookups resolve display names from product ids (see `packages/prompt-templates/README.md`).

## API handlers

- **Generation / validation:** routes under `app/api/` delegate to `@repo/api-handlers` (Gemini, image validation).
- **Leads:** `app/api/submit-lead/route.ts` — Zod-validated body, Supabase insert, territory resolution, Resend email paths (SAS vs RAQ, matched vs outside territory).
- Shared HTTP/Gemini/Supabase clients live in `packages/api-handlers/src/` — keep routes thin.

## Lead storage

- Supabase tables defined in `supabase/migrations/` (leads, visualization metadata).
- Use service-role client only on the server; anon key only where RLS-intended.
- Lead payloads align with `GenericLead` / brand extensions in `@repo/types`.

## Territory and zip codes

- Zip normalization: strip non-digits, use first 5 digits for US matching (`submit-lead` route).
- `lookupLocationByZipcode` (api-handlers / Supabase) maps zip → franchise location for routing and email templates.
- **Test zip** (`TEST_LOCATION` in gatsby-constants): special behavior for authenticated QA only; anonymous users get normal “no territory” handling.
- Centroid seeding script: root `pnpm seed:zip-centroids` (see `scripts/seed-zip-centroids.mjs`).

## Email previews

- Static previews: `apps/gatsby-glass/public/email-preview/` and `pnpm preview:emails` for local HTML review.

## When to extend ARCHITECTURE

- New brand app under `apps/`
- New shared package or a breaking change to `@repo/types` generic contracts
- New external integration (CRM, alternate AI provider)
