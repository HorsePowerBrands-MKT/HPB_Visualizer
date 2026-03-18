-- Add expiry tracking for generated visualization images (30-day default)
ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');

CREATE INDEX IF NOT EXISTS idx_visualizations_expires
  ON visualizations (expires_at)
  WHERE expires_at IS NOT NULL;

-- Track which leads have had their images retained (quote requested)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS images_retained BOOLEAN DEFAULT false;

-- One-time cleanup: null out all existing original_image_url references
UPDATE visualizations SET original_image_url = NULL WHERE original_image_url IS NOT NULL;
UPDATE leads SET original_image_url = NULL WHERE original_image_url IS NOT NULL;
