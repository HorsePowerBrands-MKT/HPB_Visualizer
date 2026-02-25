-- Migration: add visualizations (per-generation) and issue_reports tables
-- Run this in the Supabase SQL editor.

-- 1. Add team column to the existing leads table -------------------------
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS team TEXT;

-- 2. visualizations — one row per image generation (many-to-one per session)
--    hinged_config / pivot_config / sliding_config stored as JSONB so they
--    can be queried with Postgres JSON operators, e.g.:
--      SELECT * FROM visualizations WHERE hinged_config->>'direction' = 'double';
CREATE TABLE IF NOT EXISTS visualizations (
  id                      UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id              TEXT        NOT NULL,
  generation_index        INT         NOT NULL DEFAULT 1,

  -- Top-level selections
  mode                    TEXT,                   -- 'configure' | 'inspiration'
  enclosure_type          TEXT,                   -- 'hinged' | 'pivot' | 'sliding'
  framing_style           TEXT,                   -- 'frameless' | 'semi_frameless' | 'framed'
  hardware_finish         TEXT,                   -- 'chrome' | 'brushed_nickel' | ...
  handle_style            TEXT,                   -- 'ladder' | 'square' | 'd_pull' | 'knob'
  shower_shape            TEXT,                   -- 'standard' | 'neo_angle' | 'tub'

  -- Door sub-option configs (full JSON so no data is lost)
  -- hinged_config example:  {"to_ceiling": true, "direction": "double"}
  -- pivot_config example:   {"direction": "left"}
  -- sliding_config example: {"configuration": "double", "direction": "right"}
  hinged_config           JSONB,
  pivot_config            JSONB,
  sliding_config          JSONB,

  -- Image URLs (Supabase Storage)
  visualization_image_url TEXT,
  original_image_url      TEXT,

  -- Attribution
  team                    TEXT,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_visualizations_session_id    ON visualizations (session_id);
CREATE INDEX IF NOT EXISTS idx_visualizations_enclosure     ON visualizations (enclosure_type);
CREATE INDEX IF NOT EXISTS idx_visualizations_framing       ON visualizations (framing_style);
CREATE INDEX IF NOT EXISTS idx_visualizations_hardware      ON visualizations (hardware_finish);
CREATE INDEX IF NOT EXISTS idx_visualizations_team          ON visualizations (team);
CREATE INDEX IF NOT EXISTS idx_visualizations_hinged_config ON visualizations USING gin (hinged_config);
CREATE INDEX IF NOT EXISTS idx_visualizations_sliding_config ON visualizations USING gin (sliding_config);

-- 3. issue_reports — one row per report (many-to-one per session) --------
CREATE TABLE IF NOT EXISTS issue_reports (
  id                      UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id              TEXT        NOT NULL,
  message                 TEXT        NOT NULL,
  visualization_image_url TEXT,
  team                    TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_reports_session_id ON issue_reports (session_id);

-- -------------------------------------------------------------------------
-- Useful example queries (paste into Supabase SQL editor to analyse data)
-- -------------------------------------------------------------------------

-- Most popular enclosure type:
--   SELECT enclosure_type, COUNT(*) FROM visualizations GROUP BY enclosure_type ORDER BY count DESC;

-- Most popular enclosure + framing + hardware combo:
--   SELECT enclosure_type, framing_style, hardware_finish, COUNT(*)
--   FROM visualizations
--   GROUP BY enclosure_type, framing_style, hardware_finish
--   ORDER BY count DESC;

-- Hinged door: how often do users pick double door?
--   SELECT hinged_config->>'direction' AS direction, COUNT(*)
--   FROM visualizations
--   WHERE enclosure_type = 'hinged'
--   GROUP BY direction;

-- How often do hinged users go to-ceiling?
--   SELECT hinged_config->>'to_ceiling' AS to_ceiling, COUNT(*)
--   FROM visualizations
--   WHERE enclosure_type = 'hinged'
--   GROUP BY to_ceiling;

-- Sliding door configuration breakdown:
--   SELECT sliding_config->>'configuration' AS config,
--          sliding_config->>'direction'      AS direction,
--          COUNT(*)
--   FROM visualizations
--   WHERE enclosure_type = 'sliding'
--   GROUP BY config, direction;

-- Re-generate rate (sessions with more than 1 generation):
--   SELECT session_id, MAX(generation_index) AS total_gens
--   FROM visualizations
--   GROUP BY session_id
--   HAVING MAX(generation_index) > 1
--   ORDER BY total_gens DESC;
