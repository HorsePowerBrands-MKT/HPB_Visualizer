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
 * Images live in `apps/gatsby-glass/public/prompt-references/<door-type>/`
 * so they ship with the deploy (versioned, edge-cached) and are reachable
 * from disk via the Node.js runtime that the visualization route already
 * runs on.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { ReferenceImage } from '@repo/types';

/**
 * Where the reference images live on disk. Resolved relative to the Next.js
 * project root (process.cwd()), which is `apps/gatsby-glass` at runtime for
 * the gatsby-glass app — both in `next dev` and on Vercel.
 */
const REF_ROOT = path.join(process.cwd(), 'public', 'prompt-references');

/**
 * Reads a PNG from disk and returns it as a base64 ImageData payload ready
 * to hand to Gemini. Returns null if the file is missing so callers can
 * gracefully degrade to text-only prompting rather than 500-ing the route.
 */
async function readReferenceFile(
  relativePath: string
): Promise<{ data: string; mimeType: string } | null> {
  const fullPath = path.join(REF_ROOT, relativePath);
  try {
    const buf = await fs.readFile(fullPath);
    return {
      data: buf.toString('base64'),
      mimeType: 'image/png',
    };
  } catch (err) {
    console.warn(
      `[referenceImages] could not read ${fullPath}, falling back to text-only prompt:`,
      err
    );
    return null;
  }
}

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
    "style, or anything about the surrounding scene. The bathroom, tile,",
    'lighting, fixtures, finish, glass style, and handle style must all',
    'come from input_1 + the install specification — this reference is for',
    'PIVOT ANATOMY ONLY.',
  ].join('\n');
};

/**
 * Returns the reference images for the requested enclosure type + direction,
 * or [] if no references exist for that configuration. The API route can
 * pass the return value straight into `generateVisualization`'s
 * `referenceImages` field.
 */
export async function loadReferenceImagesFor(args: {
  enclosureType?: string;
  pivotDirection?: string;
}): Promise<ReferenceImage[]> {
  const { enclosureType, pivotDirection } = args;

  if (enclosureType !== 'pivot') return [];

  // For a single-pivot install we send the direction-matched reference. For a
  // french-pivot pair ('double') we send BOTH left + right references because
  // a french-pivot is functionally a mirrored pair of single pivots — left
  // door pivots from the left side, right door pivots from the right side.
  const filenamesByDirection: Record<string, ('left' | 'right')[]> = {
    left: ['left'],
    right: ['right'],
    double: ['left', 'right'],
  };
  const requested = filenamesByDirection[pivotDirection ?? 'left'] ?? ['left'];

  const refs: ReferenceImage[] = [];
  for (const dir of requested) {
    const file = await readReferenceFile(`pivot/pivot-${dir}.png`);
    if (!file) continue;
    refs.push({
      image: file,
      label: `pivot-${dir}-reference`,
      description: PIVOT_REFERENCE_DESCRIPTION(dir),
    });
  }
  return refs;
}
