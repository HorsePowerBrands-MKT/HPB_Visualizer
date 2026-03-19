-- Migration 006: link visualizations to authenticated Supabase user accounts
-- so team members can see all their past generations across devices/sessions.
-- Run this in the Supabase SQL editor.

ALTER TABLE visualizations
  ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_visualizations_user_id
  ON visualizations (user_id, created_at);
