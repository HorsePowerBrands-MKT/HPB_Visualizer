/**
 * The Gatsby Glass product modules the visualizer offers, and the small
 * amount of per-product copy shared by the lead forms. Client-safe.
 */

import type { LeadProduct } from '@repo/types';

/** Product module ids. Mirrors `VisualizerProduct` / `LeadProduct` in @repo/types. */
export type VisualizerProductModule = LeadProduct;

export const PRODUCT_MODULE_ORDER: readonly VisualizerProductModule[] = [
  'shower',
  'railing',
  'room_enclosure',
];

export const isProductModule = (value: string | null | undefined): value is VisualizerProductModule =>
  value === 'shower' || value === 'railing' || value === 'room_enclosure';

/** Short label used in the lead popup's "What are you designing?" choice. */
export const PRODUCT_MODULE_LABELS: Record<VisualizerProductModule, string> = {
  shower: 'Shower Door',
  railing: 'Glass Railing',
  room_enclosure: 'Room Enclosure',
};

/** `leads.source` value per product (also shown in the CRM). */
export const LEAD_SOURCE_BY_PRODUCT: Record<VisualizerProductModule, string> = {
  shower: 'Gatsby Glass Visualizer',
  railing: 'Gatsby Glass Railing Visualizer',
  room_enclosure: 'Gatsby Glass Enclosure Visualizer',
};
