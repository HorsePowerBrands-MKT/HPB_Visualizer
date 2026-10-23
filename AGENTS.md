# AGENTS.md — HPB Visualizer

Guidance for AI agents (Cursor, Copilot, Maestro) working in this **pnpm monorepo**. Human contributors should start with [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Repository map

| Area | Path | Role |
|------|------|------|
| Gatsby Glass app | `apps/gatsby-glass/` | Next.js 14 App Router — UI, API routes, brand prompts |
| Shared packages | `packages/*` | `@repo/api-handlers`, `@repo/prompt-templates`, `@repo/types`, `@repo/visualizer-core` |
| Database | `supabase/migrations/` | Supabase schema (leads, generations, territory) |
| Deploy | `apps/gatsby-glass/vercel.json` | Vercel project for Gatsby Glass (deploy on merge; **CI** is GitHub Actions) |

**Canonical architecture:** [ARCHITECTURE.md](ARCHITECTURE.md). **Coding norms:** [docs/CONVENTIONS.md](docs/CONVENTIONS.md). **Domain patterns:** [docs/PATTERNS.md](docs/PATTERNS.md).

## Package boundaries

- Put **brand-agnostic** logic in `packages/` (Gemini client, template engine, generic types, image utils).
- Put **Gatsby Glass–only** product types, catalog, wizard state, and UI in `apps/gatsby-glass/`.
- Import shared code via workspace names (`@repo/api-handlers`, etc.) — never copy-paste across apps.
- New brands = new `apps/<brand>/` + register templates with `registerBrandTemplates()` at startup.

## Secrets and environments

- **Never commit** `.env` or service keys. Use `apps/gatsby-glass/.env.example` as the checklist.
- **Gemini:** `GEMINI_API_KEY` — server-side only (API routes / `@repo/api-handlers`).
- **Supabase:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (client-safe), `SUPABASE_SERVICE_KEY` (server-only — leads, territory lookups).
- **Resend / email:** configured in api-handlers; preview HTML under `apps/gatsby-glass/public/email-preview/`.
- Agents must **not** run destructive SQL or apply migrations against production; author migration files only.

## Tickets and project management

- ClickUp workspace **1245693**, tickets **`HP-{number}`** (Gatsby Glass folder).
- Link format: `https://app.clickup.com/t/1245693/HP-{number}`
- Branch naming: `feature/HP-{number}-short-description` (or `bugfix/`, `hotfix/` per team convention).

## Maestro and Cursor skills

Skills are symlinked from Maestro via `npm run sync` in the [maestro](https://github.com/shineforth/maestro) repo (`sync-skill-links.js`). Invoke skills **by name** (they use `disable-model-invocation: true`).

| Skill | When to use |
|-------|-------------|
| **hpb-ticket-plan** | Plan an `HP-{number}` ticket before implementation → `.cursor/plans/HP-NNNN_*.plan.md` |
| **hpb-pr-copilot** | Open/update PR (HPB template), Copilot review loop, ClickUp doc comment |
| **copilot-local-review** | Local Copilot CLI review before push |
| **release-pr** | `develop` → `main` release PR (when that branch model applies) |

**Maestro project name:** `hpb-visualizer` in `projects.json`.

## Commands (from repo root)

```bash
pnpm install
pnpm dev              # Gatsby Glass @ localhost:3000
pnpm lint             # ESLint (app)
pnpm typecheck        # tsc --noEmit (packages + app)
pnpm test             # unit tests (packages with test scripts)
pnpm run check:docs   # doc drift guard (also runs in CI)
```

Pre-commit (Husky): lint-staged + typecheck + tests when TS/JS files are staged.

## Quality gates

- **Pre-commit:** `.husky/pre-commit`
- **CI:** `.github/workflows/ci.yml` on pull requests to `main` and `develop`
- **Doc drift:** `scripts/check-doc-drift.mjs` — required agent docs and cross-links must stay valid

## What agents should not do

- Edit `node_modules/`, `.next/`, or generated build output.
- Add secrets to the repo or log API keys.
- Bypass Zod validation on API routes or weaken territory/lead invariants without a ticket plan.
- Force-push `main` or deploy outside the team’s Vercel/GitHub flow.
