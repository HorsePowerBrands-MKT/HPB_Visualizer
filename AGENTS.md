# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is
pnpm workspace monorepo (`pnpm-workspace.yaml`) for the **HPB Visualizer**. One runnable
app today: `apps/gatsby-glass` (Next.js 14 App Router, port 3000), an AI shower-glass
visualizer. Shared code lives in `packages/*` (`api-handlers`, `prompt-templates`,
`types`, `visualizer-core`) and is consumed directly from `src` via Next's
`transpilePackages` (see `apps/gatsby-glass/next.config.js`) — the packages do NOT need to
be pre-compiled for the app to run or build.

### Standard commands (defined in root `package.json` / app `package.json`)
- Dev server: `pnpm dev` (aliases `pnpm --filter gatsby-glass dev`) → http://localhost:3000
- Lint: `pnpm lint`
- Build the app: `pnpm build:gatsby` (`next build`)

### Non-obvious caveats
- **Build the app with `pnpm build:gatsby`, not `pnpm build`.** Root `pnpm build`
  (`pnpm -r build`) runs `tsc` in every package and currently FAILS on pre-existing type
  errors in `packages/visualizer-core` (`useVisualizerState.ts`, implicit-any). This does
  not affect the app: `next build` transpiles packages from source and `next.config.js`
  sets `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds`.
- **`pnpm lint` currently reports pre-existing errors** (`react/no-unescaped-entities`
  in several components). The lint tooling itself works; these are unfixed repo issues,
  not an environment problem.
- **Env file is required for the page to render.** Copy `apps/gatsby-glass/.env.example`
  to `apps/gatsby-glass/.env`. Key behavior:
  - Server-side integrations degrade gracefully when their vars are EMPTY (empty
    `SUPABASE_URL` → API routes skip Supabase; empty `GEMINI_API_KEY` → `/api/validate-image`
    and `/api/generate-visualization` return `500 "Missing API key"`).
  - BUT the client-side Supabase browser client (`lib/supabase/client.ts`) THROWS if
    `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are missing, which
    crashes the page in the browser; the auth middleware also needs a well-formed URL.
    For local dev without real Supabase, set those two `NEXT_PUBLIC_*` vars to well-formed
    PLACEHOLDER values (a valid https URL + any non-empty key). Auth network calls then
    fail silently and the visualizer wizard renders fine.
- **Full end-to-end AI (photo validation + visualization) requires a real `GEMINI_API_KEY`.**
  Supabase keys enable lead storage, usage limits, team auth and image storage. Without
  them the wizard UI (mode selection → photo upload → configuration navigation) still works.
- Next.js hot-reloads `.env` changes automatically (no manual restart needed).
