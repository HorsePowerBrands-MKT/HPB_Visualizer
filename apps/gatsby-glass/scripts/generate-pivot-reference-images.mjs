#!/usr/bin/env node
/**
 * Regenerates `apps/gatsby-glass/lib/reference-images/pivot/bundled.ts`
 * from the source PNGs under `apps/gatsby-glass/public/prompt-references/pivot/`.
 *
 * The bundled TS module embeds the PNGs as base64 string constants so the
 * pivot-door anatomy references ship with the serverless function bundle.
 * Vercel does NOT include files from `public/` in serverless function
 * bundles — they're served by the CDN — so any reference image we want
 * available at request time must either be pre-bundled or fetched over the
 * network. Pre-bundling via this generator is the simplest, most reliable
 * approach (no extra HTTP round-trip, no Next.js outputFileTracingIncludes
 * gymnastics).
 *
 * Run from the gatsby-glass app root:
 *   node scripts/generate-pivot-reference-images.mjs
 *
 * Or via pnpm from the repo root:
 *   pnpm --filter gatsby-glass exec node scripts/generate-pivot-reference-images.mjs
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');

const SOURCE_DIR = path.join(APP_ROOT, 'public', 'prompt-references', 'pivot');
const OUT_PATH = path.join(
  APP_ROOT,
  'lib',
  'reference-images',
  'pivot',
  'bundled.ts'
);

/**
 * Direction → source filename (relative to SOURCE_DIR). Add new entries here
 * to extend coverage (e.g., a future "double" reference).
 */
const VARIANTS = [
  { direction: 'left', filename: 'pivot-left.png' },
  { direction: 'right', filename: 'pivot-right.png' },
];

function encode(filename) {
  const buf = fs.readFileSync(path.join(SOURCE_DIR, filename));
  return buf.toString('base64');
}

const header = `// AUTO-GENERATED FILE — do not edit by hand.
//
// Source PNGs live in apps/gatsby-glass/public/prompt-references/pivot/
// (the public/ copies are kept around purely so designers can preview the
// raw reference images in a browser). The runtime API route does NOT read
// from the filesystem — Vercel serverless functions cannot reach files under
// public/ at request time. Instead, the PNGs are embedded directly here as
// base64 string constants, which guarantees they ship with the function bundle
// regardless of deploy target.
//
// To regenerate after changing the source PNGs, run:
//   node scripts/generate-pivot-reference-images.mjs
// (from apps/gatsby-glass).

export interface BundledPivotReferenceImage {
  readonly direction: 'left' | 'right';
  readonly mimeType: 'image/png';
  readonly data: string;
}
`;

const blocks = VARIANTS.map(({ direction, filename }) => {
  const data = encode(filename);
  console.error(`${direction}: ${Math.round(data.length / 1024)}KB base64`);
  return `\nexport const PIVOT_${direction.toUpperCase()}_REFERENCE: BundledPivotReferenceImage = {
  direction: ${JSON.stringify(direction)},
  mimeType: 'image/png',
  data: ${JSON.stringify(data)},
};
`;
});

fs.writeFileSync(OUT_PATH, header + blocks.join(''));
console.error(`Wrote ${path.relative(APP_ROOT, OUT_PATH)}`);
