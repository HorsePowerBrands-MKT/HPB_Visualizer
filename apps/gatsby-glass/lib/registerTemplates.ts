/**
 * Brand-template registration for Gatsby Glass.
 *
 * Importing this module triggers `registerBrandTemplates()` so the engine
 * resolves prompts against the rich Gatsby Glass templates instead of the
 * generic defaults bundled in `@repo/prompt-templates`.
 *
 * The shower templates are the "active" templates by type (visualization /
 * inspiration / system / validation). The railing templates are registered
 * by id alongside them and looked up with `getTemplateById` from
 * `lib/railing/promptBuilder.ts`, so the engine's per-type registry stays
 * shower-only and untouched.
 *
 * This module must be imported before any prompt is built. It is currently
 * imported from:
 *  - `lib/promptBuilder.ts`             (client-side shower prompt construction)
 *  - `lib/railing/promptBuilder.ts`     (client + server railing prompts)
 *  - `app/api/generate-visualization/route.ts` (server-side system prompt)
 *  - `app/api/validate-image/route.ts`  (server-side validation prompt)
 *
 * Re-importing is safe — registration is idempotent.
 */

import { registerBrandTemplates } from '@repo/prompt-templates';
import { gatsbyGlassTemplates, gatsbyGlassRegistry } from '../prompts/gatsby-templates';
import { railingTemplates } from '../prompts/railing-templates';

registerBrandTemplates({ ...gatsbyGlassTemplates, ...railingTemplates }, gatsbyGlassRegistry);

export {};
