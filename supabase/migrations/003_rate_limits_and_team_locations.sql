-- Migration 003: rate limiting + team location authentication
-- Run this in the Supabase SQL editor.

-- 1. rate_limits — one row per image generation, used to enforce monthly caps
CREATE TABLE IF NOT EXISTS rate_limits (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fingerprint TEXT       NOT NULL,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_fingerprint
  ON rate_limits (user_fingerprint, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip
  ON rate_limits (ip_address, created_at);

-- 2. team_locations — maps Supabase Auth users (by email) to franchise locations
--    Populate via the Supabase dashboard or a future admin UI.
--    Example: INSERT INTO team_locations (email, location_id, location_name)
--             VALUES ('store042@gatsbyglass.com', 'LOC-042', 'Gatsby Glass Plano');
CREATE TABLE IF NOT EXISTS team_locations (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email           TEXT        UNIQUE NOT NULL,
  location_id     TEXT        NOT NULL,
  location_name   TEXT,
  is_active       BOOLEAN     DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_locations_email
  ON team_locations (email);
