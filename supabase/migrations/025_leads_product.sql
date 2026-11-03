-- Migration 025: product-aware leads
-- Adds a product discriminator plus the human-readable summary and the
-- structured selections for non-shower product lines (first: glass railing)
-- to the leads table. Shower leads keep using the existing door_type / finish /
-- hardware / handle_style / track_preference / shower_shape columns.
--
-- Existing rows default to 'shower'; no backfill required.
-- Run this in the Supabase SQL editor BEFORE deploying the lead-capture code
-- that writes these columns.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS product         TEXT  NOT NULL DEFAULT 'shower',  -- 'shower' | 'railing'
  ADD COLUMN IF NOT EXISTS product_summary TEXT,                             -- e.g. "Exterior Deck • Base Shoe • Top-Mounted Handrail • Matte Black"
  ADD COLUMN IF NOT EXISTS product_config  JSONB;                            -- product-specific selections (same shape as visualizations.product_config)

-- Railing product_config example:
--   {"mode": "configure", "application": "exterior_deck", "railing_system": "base_shoe",
--    "handrail": "top_mount", "finish": "matte_black", "existing_condition": "open_edge",
--    "catalog_version": "2025.10"}

CREATE INDEX IF NOT EXISTS idx_leads_product ON leads (product);
