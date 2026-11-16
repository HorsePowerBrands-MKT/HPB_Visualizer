/**
 * CSS filter to tint black line-art SVGs/PNGs to brand light gold (`brand-secondary` / `#e4bf6e`).
 * Do not use `brand-primary` (`#a37529`) — consumer UI spec is the lighter gold.
 *
 * `brightness(0) saturate(100%)` flattens any source color to black first, so the
 * result doesn't depend on the icon's original color. Measured in Chrome via canvas
 * `ctx.filter` on black: renders #e5bf6d (target #e4bf6e). Re-measure if you edit it.
 */
export const BRAND_LINE_ART_GOLD_FILTER =
  'brightness(0) saturate(100%) invert(80%) sepia(20%) saturate(800%) hue-rotate(2deg) brightness(91%)';