-- Migration 024: product-aware visualizations
-- Adds a product discriminator and a free-form product config to the
-- visualizations table so non-shower product lines (first: glass railing)
-- can be saved alongside shower generations without new columns per product.
--
-- Existing rows default to 'shower'; no backfill required.
-- Run this in the Supabase SQL editor.

ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS product        TEXT  NOT NULL DEFAULT 'shower',  -- 'shower' | 'railing'
  ADD COLUMN IF NOT EXISTS product_config JSONB;                            -- product-specific selections

-- Railing product_config example:
--   {"mode": "configure", "application": "exterior_deck", "railing_system": "base_shoe",
--    "handrail": "handrail", "finish": "matte_black", "existing_condition": "existing_railing"}

CREATE INDEX IF NOT EXISTS idx_visualizations_product        ON visualizations (product);
CREATE INDEX IF NOT EXISTS idx_visualizations_product_config ON visualizations USING gin (product_config);
