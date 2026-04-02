-- Migration 014: Add access level to team_locations
-- Run this in the Supabase SQL editor.
--
-- Tiered access levels:
--   'member' (default) - standard franchise team member
--   'social'           - social/marketing team, limited admin pages
--   'admin'            - full access to all admin features
--
-- Higher tiers inherit lower-tier access, so 'admin' can see everything
-- 'social' can, and 'social' can see everything 'member' can.

ALTER TABLE team_locations
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'member';

CREATE INDEX IF NOT EXISTS idx_team_locations_access_level
  ON team_locations (access_level);
