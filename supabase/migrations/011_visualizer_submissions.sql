-- Migration 011: Create visualizer_submissions table for consent-driven photo storage.
-- Marketing/social team can cherry-pick before/after images with marketing consent.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS visualizer_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  original_photo_path text NOT NULL,
  generated_image_path text,
  upload_consent boolean NOT NULL DEFAULT true,
  marketing_consent boolean NOT NULL DEFAULT false,
  source_url text,
  metadata jsonb DEFAULT '{}'
);

-- Enable RLS (all app access goes through the service role key in server routes,
-- which bypasses RLS. This is defense-in-depth: if the anon key were ever used
-- against this table directly, no rows would be accessible.)
ALTER TABLE visualizer_submissions ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated roles: the table is inaccessible via the
-- publishable (anon) key. All reads and writes go through server-side Route
-- Handlers using the service role key, which bypasses RLS.

-- Index for the purge cycle (daily cron deletes expired rows)
CREATE INDEX IF NOT EXISTS idx_submissions_expires_at
  ON visualizer_submissions (expires_at)
  WHERE expires_at IS NOT NULL;

-- Index for the admin UI default filter (marketing-approved, not expired)
CREATE INDEX IF NOT EXISTS idx_submissions_marketing
  ON visualizer_submissions (marketing_consent, expires_at)
  WHERE marketing_consent = true;
