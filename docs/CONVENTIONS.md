# Conventions — HPB Visualizer

TypeScript and Next.js conventions for the monorepo. Architecture placement rules live in [ARCHITECTURE.md](../ARCHITECTURE.md).

## TypeScript

- **Strict** TypeScript in apps and packages; prefer explicit types on public APIs and route handlers.
- Use **`@repo/*` workspace imports** for shared packages; avoid deep relative paths across package boundaries.
- Prefer `interface` for object shapes used in components; use `type` for unions and mapped types.
- Use **Zod** (`z.object`, `.safeParse`) at API boundaries; return `400` with a safe message on validation failure — never echo raw Zod errors to clients in production.

## React / Next.js (Gatsby Glass)

- **App Router** under `apps/gatsby-glass/app/`; colocate route handlers in `app/api/**/route.ts`.
- Client components: `"use client"` only when needed (hooks, browser APIs, wizard interactivity).
- Server-only code (Gemini, service role Supabase, Resend) stays in API routes or `@repo/api-handlers` — not in client bundles.
- Styling: **Tailwind** in the app; use `cn()` / `cva` patterns already in components.
- Env: use `process.env.NEXT_PUBLIC_*` only for values safe in the browser; everything else is server-only.

## API routes

- Parse JSON with try/catch; validate with Zod schemas (see `apps/gatsby-glass/lib/validation.ts`).
- Use consistent error shapes (`{ error: string }` or project `APIError` from `@repo/types` where applicable).
- Log server errors with a short prefix (e.g. `[SUBMIT-LEAD]`) — no PII in logs.
- **Await** async email/CRM side effects in serverless handlers before returning (Vercel cuts off after response).

## Naming

| Item | Convention |
|------|------------|
| Packages | `@repo/<kebab-name>` in `packages/` |
| Brand types | `apps/gatsby-glass/lib/gatsby-types.ts` (canonical for shower products) |
| Constants | `lib/gatsby-constants/` |
| Hooks | `useVisualizerState`, `useRailingVisualizerState`, etc. |
| API routes | kebab-case folders under `app/api/` |

## Git and PRs

- Ticket id in branch and Harvest notes: `HP-{number}`.
- Use [.github/pull_request_template.md](../.github/pull_request_template.md) and **hpb-pr-copilot** for PR + ClickUp documentation.
- CI must pass (`lint`, `typecheck`, `test`, `check:docs`) before merge.

## Adding code

1. Decide shared vs brand-specific (see ARCHITECTURE).
2. Add or extend Zod schemas when touching request/response payloads.
3. Run `pnpm typecheck` and `pnpm test` locally.
4. Update [PATTERNS.md](PATTERNS.md) or ARCHITECTURE only when behavior or boundaries change materially.
