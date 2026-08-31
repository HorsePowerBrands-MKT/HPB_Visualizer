-- Migration 023: Candidate user segment
--
-- Adds a distinct candidate user type for corporate-sponsored trial access.
-- Candidates are provisioned manually by admins, sign in via magic link at /login,
-- and are subject to a monthly rendering cap (default 10). Team members remain unlimited.

ALTER TABLE team_locations
  ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'team'
    CHECK (user_type IN ('team', 'candidate')),
  ADD COLUMN IF NOT EXISTS rendering_cap INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS auth_user_id UUID DEFAULT NULL;

COMMENT ON COLUMN team_locations.user_type IS
  'User segment: team (franchise/corporate staff) or candidate (corporate trial access)';
COMMENT ON COLUMN team_locations.rendering_cap IS
  'Monthly rendering cap for candidate users; NULL means unlimited (team members)';
COMMENT ON COLUMN team_locations.auth_user_id IS
  'Supabase Auth user UUID, backfilled on first login for visualization joins';

CREATE INDEX IF NOT EXISTS idx_team_locations_user_type
  ON team_locations (user_type)
  WHERE user_type = 'candidate';

CREATE INDEX IF NOT EXISTS idx_team_locations_auth_user_id
  ON team_locations (auth_user_id)
  WHERE auth_user_id IS NOT NULL;
