/**
 * Gatsby Glass metal hardware finishes
 *
 * One catalog shared by the Glass Railing and Room Enclosure modules so the
 * two product lines offer the same five finishes with identical consumer
 * copy, swatches and backend descriptors. (The shower module keeps its own,
 * older finish list in `lib/gatsby-constants`.)
 *
 * `name`, `description` and `details` are consumer-facing. `promptDescriptor`
 * is backend-facing and only ever reaches the prompt layer.
 *
 * Pure data. No React, no I/O.
 */

export type MetalFinish =
  | 'matte_black'
  | 'brushed_stainless'
  | 'polished_stainless'
  | 'polished_brass'
  | 'satin_brass';

export interface MetalFinishEntry {
  name: string;
  /** One-line copy under the option label. */
  description: string;
  /** Longer plain-English copy for the info modal. */
  details: string;
  /** Backend-facing. Never rendered to the consumer. */
  promptDescriptor: string;
}

export const metalFinishes: Record<MetalFinish, MetalFinishEntry> = {
  matte_black: {
    name: 'Matte Black',
    description: 'Modern flat black',
    details:
      'A bold, contemporary flat black finish that frames the glass with crisp contrast and hides fingerprints well.',
    promptDescriptor: 'matte black',
  },
  brushed_stainless: {
    name: 'Brushed Stainless',
    description: 'Soft satin stainless steel',
    details:
      'A soft satin stainless steel finish with subtle brush marks. Understated, durable, and at home indoors or out.',
    promptDescriptor: 'brushed (satin) stainless steel',
  },
  polished_stainless: {
    name: 'Polished Stainless',
    description: 'Bright mirror stainless steel',
    details:
      'A bright, mirror-like stainless steel finish that catches the light and reads as crisp and high-end.',
    promptDescriptor: 'polished (mirror) stainless steel',
  },
  polished_brass: {
    name: 'Polished Brass',
    description: 'Bright, shiny warm gold',
    details:
      'A luxurious, high-shine brass finish with a warm gold tone that adds a touch of glamour and pairs beautifully with warm woods and stone.',
    promptDescriptor: 'polished (mirror) brass: bright, shiny, reflective warm gold',
  },
  satin_brass: {
    name: 'Satin Brass',
    description: 'Soft brushed champagne gold',
    details:
      'A soft, brushed brass finish with a warm champagne-gold tone and a gentle sheen. Elegant and understated, without the mirror shine of polished brass.',
    promptDescriptor:
      'satin (brushed) brass: soft warm champagne-gold with fine brush lines and a low sheen, not mirror-bright',
  },
};

/** CSS backgrounds for finish swatches (same style as the shower hardware swatches). */
export const metalFinishSwatches: Record<MetalFinish, string> = {
  matte_black: '#171717',
  brushed_stainless:
    'repeating-linear-gradient(45deg, #d0d0d0, #d0d0d0 2px, #c0c0c0 2px, #c0c0c0 4px)',
  polished_stainless: 'linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #a0a0a0 100%)',
  polished_brass: 'linear-gradient(135deg, #fef9c3 0%, #facc15 50%, #ca8a04 100%)',
  satin_brass:
    'repeating-linear-gradient(45deg, #d8bf88, #d8bf88 2px, #c9ad74 2px, #c9ad74 4px)',
};

/** Display order in the wizard. */
export const METAL_FINISH_ORDER: readonly MetalFinish[] = [
  'matte_black',
  'brushed_stainless',
  'polished_stainless',
  'polished_brass',
  'satin_brass',
];

/** The only finishes a prompt may be assembled with. */
export const APPROVED_METAL_FINISHES: readonly MetalFinish[] = METAL_FINISH_ORDER;

/**
 * Match Inspiration with no explicit finish selection. Maps the hardware
 * color in input_2 onto one approved finish; the model must not fall back
 * to black. (Railing feedback 2026-10-23: silver / nickel inspiration
 * hardware rendered as matte black.)
 */
export const METAL_FINISH_INSPIRATION_MAPPING: readonly string[] = [
  '- Read the hardware color in input_2 and map it to exactly ONE approved finish:',
  '  • silver, grey, nickel, chrome, satin, brushed, or any light silver metal that is not mirror-bright → BRUSHED (satin) STAINLESS STEEL',
  '  • bright mirror-polished silver → POLISHED (mirror) STAINLESS STEEL',
  '  • bright, shiny, mirror-like gold or brass → POLISHED BRASS',
  '  • brushed or matte gold, champagne, warm brass, copper, rose gold, or light bronze → SATIN BRASS',
  '  • black, charcoal, gunmetal, dark bronze, or any dark metal → MATTE BLACK',
  '  • wood or painted colors are NOT approved: use the approved metal finish closest in tone (satin brass for warm tones, brushed stainless for light neutral tones, matte black for dark tones)',
  '- Do NOT default to matte black. Black is correct only when the hardware in input_2 is clearly dark.',
];
