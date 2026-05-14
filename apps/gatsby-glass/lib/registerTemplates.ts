/**
 * Brand-template registration for Gatsby Glass.
 *
 * Importing this module triggers `registerBrandTemplates()` so the engine
 * resolves prompts against the rich Gatsby Glass templates instead of the
 * generic defaults bundled in `@repo/prompt-templates`.
 *
 * This module must be imported before any prompt is built. It is currently
 * imported from:
 *  - `lib/promptBuilder.ts`             (client-side prompt construction)
 *  - `app/api/generate-visualization/route.ts` (server-side system prompt)
 *  - `app/api/validate-image/route.ts`  (server-side validation prompt)
 *
 * Re-importing is safe — registration is idempotent.
 */

import { registerBrandTemplates } from '@repo/prompt-templates';
import { gatsbyGlassTemplates, gatsbyGlassRegistry } from '../prompts/gatsby-templates';

registerBrandTemplates(gatsbyGlassTemplates, gatsbyGlassRegistry);

export {};
