-- Migration 002: add missing columns to the existing visualizations table
-- Run this in the Supabase SQL editor.

-- Rename track_preference -> framing_style (or add framing_style if rename already done)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visualizations' AND column_name = 'track_preference'
  ) THEN
    ALTER TABLE visualizations RENAME COLUMN track_preference TO framing_style;
  ELSE
    ALTER TABLE visualizations ADD COLUMN IF NOT EXISTS framing_style TEXT;
  END IF;
END $$;

-- Add door sub-option config columns (JSONB)
ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS hinged_config  JSONB,
  ADD COLUMN IF NOT EXISTS pivot_config   JSONB,
  ADD COLUMN IF NOT EXISTS sliding_config JSONB;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_visualizations_framing        ON visualizations (framing_style);
CREATE INDEX IF NOT EXISTS idx_visualizations_hinged_config  ON visualizations USING gin (hinged_config);
CREATE INDEX IF NOT EXISTS idx_visualizations_sliding_config ON visualizations USING gin (sliding_config);
