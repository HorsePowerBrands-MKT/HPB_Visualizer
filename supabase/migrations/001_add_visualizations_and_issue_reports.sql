-- Migration: add visualizations (per-generation) and issue_reports tables
-- Run this in the Supabase SQL editor.

-- 1. Add team column to the existing leads table -------------------------
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS team TEXT;

-- 2. visualizations — one row per image generation (many-to-one per session)
CREATE TABLE IF NOT EXISTS visualizations (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id       TEXT        NOT NULL,
  generation_index INT         NOT NULL DEFAULT 1,
  mode             TEXT,
  enclosure_type   TEXT,
  hardware_finish  TEXT,
  handle_style     TEXT,
  track_preference TEXT,
  shower_shape     TEXT,
  visualization_image_url TEXT,
  original_image_url      TEXT,
  team             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_visualizations_session_id ON visualizations (session_id);

-- 3. issue_reports — one row per report (many-to-one per session) --------
CREATE TABLE IF NOT EXISTS issue_reports (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id              TEXT        NOT NULL,
  message                 TEXT        NOT NULL,
  visualization_image_url TEXT,
  team                    TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_issue_reports_session_id ON issue_reports (session_id);
