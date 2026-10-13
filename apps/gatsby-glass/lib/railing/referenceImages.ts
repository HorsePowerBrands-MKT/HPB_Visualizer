/**
 * Server-side loader for railing reference photos attached to the Gemini
 * request after input_1 (and input_2 on the inspiration path).
 *
 * The photos are real Gatsby Glass installs bundled as base64 in
 * `lib/reference-images/railings/bundled.ts` (see the generator script for
 * why they are not read from `public/`). Each one travels with a description
 * that tells the model exactly what to copy (hardware anatomy and proportion)
 * and what to ignore (the room, flooring, lighting, viewpoint).
 *
 * Selection logic (max two images):
 *   - handrail = side_mount → stair photo with base shoe + black side rail
 *   - handrail = top_mount  → stair cap-rail photo for staircases,
 *                             landing cap-rail photo otherwise
 *   - railing_system = base_shoe and no handrail reference already shows a
 *     base shoe → landing photo as the base-shoe anchor (copy the shoe only)
 *   - spigot has no photo yet (none in the gallery set); text-only.
 *   - inspiration path with no explicit selections → none (input_2 is the
 *     style donor; a second donor would fight it).
 */

import type { ReferenceImage } from '@repo/types';
import {
  STAIR_BASE_SHOE_SIDE_MOUNT,
  STAIR_TOP_CAP_RAIL,
  LANDING_BASE_SHOE_TOP_CAP_RAIL,
  type BundledRailingReferenceImage,
} from '../reference-images/railings/bundled';

const IGNORE =
  'DO NOT copy from this reference: the room, walls, flooring, stairs, furniture, lighting, camera angle, or the amount of glass. The space, viewpoint, placement and extent of the railing come ONLY from input_1 and the specification.';

const DESCRIPTIONS = {
  sideMount: [
    'AUTHORITATIVE GATSBY GLASS REFERENCE — BASE SHOE + SIDE-MOUNTED HANDRAIL.',
    'A real install: tall frameless clear glass panels seated in a slim, dark, continuous base shoe that sits flush at the floor line (only a few inches tall, no posts, no clamps).',
    'The handrail is a slim rectangular bar mounted on small standoff pins on the FACE of the glass, a few inches below the top edge, following the stair pitch; the polished glass edge stays visible above it.',
    'Copy ONLY: the base shoe proportion, the standoff-mounted side rail and its position relative to the glass edge, the panel height and the clean uninterrupted glass.',
    IGNORE,
  ].join('\n'),
  stairCap: [
    'AUTHORITATIVE GATSBY GLASS REFERENCE — TOP-MOUNTED CAP RAIL ON A STAIR.',
    'A real install: tall frameless clear glass panels with a thin, square-profile cap rail channel seated ON the top edge of the glass, continuous along the stair pitch. The cap is low-profile (about the thickness of a finger), NOT a round grab bar and NOT standing off the glass.',
    'Copy ONLY: the slim cap-rail profile hugging the glass edge, the panel height, the absence of posts or clamps, the clean glass joints.',
    IGNORE,
  ].join('\n'),
  landingCap: [
    'AUTHORITATIVE GATSBY GLASS REFERENCE — BASE SHOE + TOP-MOUNTED CAP RAIL ON A LEVEL LANDING.',
    'A real install: tall frameless clear glass panels seated in a slim, dark, continuous base shoe flush at the floor, with a thin square cap rail channel on the top edge, mitered at the corners. No posts, no clamps, wide panels with minimal joints.',
    'Copy ONLY: the base shoe proportion at the floor line, the slim cap-rail profile, the panel height and the corner treatment.',
    IGNORE,
  ].join('\n'),
  landingCapRailOnly: [
    'AUTHORITATIVE GATSBY GLASS REFERENCE — TOP-MOUNTED CAP RAIL PROFILE ONLY.',
    'A real install showing tall frameless clear glass with a thin square cap rail channel on the top edge, mitered at the corners. Copy ONLY the slim cap-rail profile hugging the glass edge and the panel height.',
    'This photo also shows a continuous base shoe at the floor — IGNORE it entirely; the mounting system (spigots) comes from the specification, not from this photo.',
    IGNORE,
  ].join('\n'),
  landingBaseShoeOnly: [
    'AUTHORITATIVE GATSBY GLASS REFERENCE — BASE SHOE PROPORTION ONLY.',
    'A real install showing tall frameless clear glass seated in a slim, dark, continuous base shoe flush at the floor line: a shallow channel only a few inches tall, no posts, no clamps, wide panels with minimal joints.',
    'Copy ONLY the base shoe and the panel height. This photo also shows a cap rail on top of the glass — IGNORE the cap rail entirely; the handrail treatment comes from the specification, not from this photo.',
    IGNORE,
  ].join('\n'),
};

function toReferenceImage(
  bundled: BundledRailingReferenceImage,
  label: string,
  description: string
): ReferenceImage {
  return {
    image: { data: bundled.data, mimeType: bundled.mimeType },
    label,
    description,
  };
}

export async function loadRailingReferenceImagesFor(args: {
  railingSystem?: string;
  handrail?: string;
  application?: string;
}): Promise<ReferenceImage[]> {
  const { railingSystem, handrail, application } = args;
  const refs: ReferenceImage[] = [];
  let baseShoeShown = false;

  if (handrail === 'side_mount') {
    refs.push(toReferenceImage(STAIR_BASE_SHOE_SIDE_MOUNT, 'railing-side-mount', DESCRIPTIONS.sideMount));
    baseShoeShown = true;
  } else if (handrail === 'top_mount') {
    if (application === 'interior_staircase') {
      refs.push(toReferenceImage(STAIR_TOP_CAP_RAIL, 'railing-stair-cap-rail', DESCRIPTIONS.stairCap));
    } else if (railingSystem === 'base_shoe') {
      refs.push(toReferenceImage(LANDING_BASE_SHOE_TOP_CAP_RAIL, 'railing-landing-cap-rail', DESCRIPTIONS.landingCap));
      baseShoeShown = true;
    } else {
      // Spigot (or system left to the inspiration photo): show the cap rail
      // but explicitly disown the base shoe visible in the same photo.
      refs.push(toReferenceImage(LANDING_BASE_SHOE_TOP_CAP_RAIL, 'railing-cap-rail-only', DESCRIPTIONS.landingCapRailOnly));
    }
  }

  if (railingSystem === 'base_shoe' && !baseShoeShown) {
    refs.push(
      toReferenceImage(LANDING_BASE_SHOE_TOP_CAP_RAIL, 'railing-base-shoe', DESCRIPTIONS.landingBaseShoeOnly)
    );
  }

  return refs.slice(0, 2);
}
