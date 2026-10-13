#!/usr/bin/env node
/**
 * Regenerates `apps/gatsby-glass/lib/reference-images/railings/bundled.ts`
 * from the source JPGs under `apps/gatsby-glass/public/prompt-references/railings/`.
 *
 * Same approach as the pivot references: Vercel does not ship `public/` with
 * serverless functions, so the photos are embedded as base64 constants and
 * attached to the Gemini request by `lib/railing/referenceImages.ts`.
 *
 * Source photos are real Gatsby Glass installs chosen because they show the
 * approved system vocabulary (frameless glass in a base shoe; top cap rail or
 * side-mounted rail). Post-and-clamp and horizontal-bar photos from the same
 * gallery are deliberately NOT bundled — they would teach the model systems
 * the prompt forbids.
 *
 * Run from the gatsby-glass app root:
 *   node scripts/generate-railing-reference-images.mjs
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');

const SOURCE_DIR = path.join(APP_ROOT, 'public', 'prompt-references', 'railings');
const OUT_PATH = path.join(APP_ROOT, 'lib', 'reference-images', 'railings', 'bundled.ts');

/** key → source filename. Keys are referenced by lib/railing/referenceImages.ts. */
const VARIANTS = [
  { key: 'STAIR_BASE_SHOE_SIDE_MOUNT', filename: 'stair-base-shoe-side-mount-black.jpg' },
  { key: 'STAIR_TOP_CAP_RAIL', filename: 'stair-top-cap-rail-black.jpg' },
  { key: 'LANDING_BASE_SHOE_TOP_CAP_RAIL', filename: 'landing-base-shoe-top-cap-rail-dark.jpg' },
];

const header = `// AUTO-GENERATED FILE — do not edit by hand.
//
// Source JPGs live in apps/gatsby-glass/public/prompt-references/railings/.
// Regenerate after changing them with:
//   node scripts/generate-railing-reference-images.mjs
// (from apps/gatsby-glass).

export interface BundledRailingReferenceImage {
  readonly key: string;
  readonly mimeType: 'image/jpeg';
  readonly data: string;
}
`;

const blocks = VARIANTS.map(({ key, filename }) => {
  const data = fs.readFileSync(path.join(SOURCE_DIR, filename)).toString('base64');
  console.error(`${key}: ${Math.round(data.length / 1024)}KB base64`);
  return `\nexport const ${key}: BundledRailingReferenceImage = {
  key: ${JSON.stringify(key)},
  mimeType: 'image/jpeg',
  data: ${JSON.stringify(data)},
};
`;
});

fs.writeFileSync(OUT_PATH, header + blocks.join(''));
console.error(`Wrote ${path.relative(APP_ROOT, OUT_PATH)}`);
