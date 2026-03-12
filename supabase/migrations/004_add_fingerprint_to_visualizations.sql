-- Migration 004: link visualizations to the persistent user fingerprint
-- so past generations can be retrieved across sessions.
-- Run this in the Supabase SQL editor.

ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS user_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_visualizations_fingerprint
  ON visualizations (user_fingerprint, created_at);
