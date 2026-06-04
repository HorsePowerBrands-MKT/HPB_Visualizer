/**
 * Server-side loader for authoritative product reference images that get
 * appended to the multimodal Gemini input.
 *
 * The base Gemini model has a strong "shower door = hinged" prior and tends
 * to substitute hinged doors when asked for pivot. Reference images of real
 * pivot installs give the model an unambiguous visual anchor — see the
 * `must_install` / `visibility_requirements` blocks in
 * `apps/gatsby-glass/prompts/gatsby-templates.ts` for the related text-only
 * pressure.
 *
 * IMPORTANT: the reference image bytes are NOT read from the filesystem at
 * request time. Vercel serverless functions do not bundle files from
 * `public/`, so an earlier fs-based implementation silently fell back to
 * "no reference attached" in production and the model kept rendering
 * hinged doors. The PNGs are now embedded directly in
 * `./reference-images/pivot/bundled.ts` as base64 string constants — this
 * guarantees they ship with the function bundle on every deploy target.
 *
 * To swap the reference images, edit the PNGs at
 * `apps/gatsby-glass/public/prompt-references/pivot/` (designers can also
 * preview them there in the browser) and then regenerate the bundled TS:
 *   pnpm --filter gatsby-glass exec node scripts/generate-pivot-reference-images.mjs
 */

import type { ReferenceImage } from '@repo/types';
import {
  PIVOT_LEFT_REFERENCE,
  PIVOT_RIGHT_REFERENCE,
  type BundledPivotReferenceImage,
} from './reference-images/pivot/bundled';

const PIVOT_REFERENCE_DESCRIPTION = (direction: 'left' | 'right') => {
  const dirLabel = direction === 'left' ? 'LEFT' : 'RIGHT';
  return [
    `AUTHORITATIVE PIVOT-DOOR REFERENCE IMAGE (${dirLabel} OPEN).`,
    `This is a product photograph of a correctly-rendered pivot shower door`,
    `with the operating door configured to open ${dirLabel}.`,
    'Use it ONLY as a reference for the following pivot anatomy:',
    '  • the pivot mechanism is two small fittings — ONE at the TOP horizontal',
    '    edge of the door and ONE at the BOTTOM horizontal edge — both on the',
    '    same offset vertical axis (not centered, not on the edge);',
    '  • the vertical (left and right) edges of the door are completely BARE',
    '    — no side hinges, no clamps, no brackets;',
    '  • there is a single fixed-glass return panel adjacent to the operating',
    '    door, and the door is shown FULLY CLOSED;',
    '  • the handle sits on the side of the door OPPOSITE the offset pivot.',
    'DO NOT copy from this reference: the white background, any text labels',
    `("${dirLabel.toLowerCase()} open"), the chrome finish, the exact handle`,
    'style, or anything about the surrounding scene. The bathroom, tile,',
    'lighting, fixtures, finish, glass style, and handle style must all',
    'come from input_1 + the install specification — this reference is for',
    'PIVOT ANATOMY ONLY.',
  ].join('\n');
};

function toReferenceImage(
  bundled: BundledPivotReferenceImage
): ReferenceImage {
  return {
    image: {
      data: bundled.data,
      mimeType: bundled.mimeType,
    },
    label: `pivot-${bundled.direction}-reference`,
    description: PIVOT_REFERENCE_DESCRIPTION(bundled.direction),
  };
}

/**
 * Returns the reference images for the requested enclosure type + direction,
 * or [] if no references exist for that configuration. The API route can
 * pass the return value straight into the `referenceImages` field on the
 * `VisualizationRequest`.
 *
 * Async so callers don't have to change if we later switch to a remote
 * fetch (e.g., Supabase storage) — but today this is a pure in-memory
 * lookup that never throws and never blocks on I/O.
 */
export async function loadReferenceImagesFor(args: {
  enclosureType?: string;
  pivotDirection?: string;
}): Promise<ReferenceImage[]> {
  const { enclosureType, pivotDirection } = args;

  if (enclosureType !== 'pivot') return [];

  // For a single-pivot install we send the direction-matched reference. For
  // a french-pivot pair ('double') we send BOTH left + right references
  // because a french-pivot is functionally a mirrored pair of single pivots
  // — left door pivots from the left side, right door pivots from the
  // right side.
  switch (pivotDirection) {
    case 'left':
      return [toReferenceImage(PIVOT_LEFT_REFERENCE)];
    case 'right':
      return [toReferenceImage(PIVOT_RIGHT_REFERENCE)];
    case 'double':
      return [
        toReferenceImage(PIVOT_LEFT_REFERENCE),
        toReferenceImage(PIVOT_RIGHT_REFERENCE),
      ];
    default:
      // Unknown / missing direction — default to the LEFT reference so the
      // model still gets a pivot-anatomy anchor rather than going back to
      // text-only prompting.
      return [toReferenceImage(PIVOT_LEFT_REFERENCE)];
  }
}
