-- Migration 007: Sync Gatsby Glass locations from ZeeDatabase API
-- Run this in the Supabase SQL editor.
--
-- Creates a function that pulls all "Operating" Gatsby Glass locations
-- from the ZeeDatabase API and upserts them into team_locations.
-- Locations that leave "Operating" status are marked is_active = false.
-- Scheduled daily at 6 AM UTC via pg_cron.

-- 1. Enable required extensions -----------------------------------------------

CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 2. Store API credentials in Supabase Vault ----------------------------------
-- (Run these separately if your project supports Vault; otherwise the
--  credentials are embedded in the function below as a fallback.)

-- SELECT vault.create_secret(
--   'aHBiOkNCeXU0aUlCSGRWZEZ4RA==',
--   'zdb_api_basic_auth',
--   'ZeeDatabase API Basic Auth token (base64 of hpb:CByu4iIBHdVdFxD)'
-- );

-- 3. Create the sync function -------------------------------------------------

CREATE OR REPLACE FUNCTION sync_gatsby_glass_locations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_response extensions.http_response;
  locations    jsonb;
  loc          jsonb;
  loc_email    text;
  loc_id       text;
  loc_name     text;
  api_emails   text[] := '{}';
  was_insert   int;
  cnt_inserted int := 0;
  cnt_updated  int := 0;
  deactivated  int := 0;
  auth_token   text;
BEGIN
  -- Resolve auth token: try Vault first, fall back to hardcoded value.
  BEGIN
    SELECT decrypted_secret INTO auth_token
    FROM vault.decrypted_secrets
    WHERE name = 'zdb_api_basic_auth'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    auth_token := NULL;
  END;

  IF auth_token IS NULL OR auth_token = '' THEN
    auth_token := 'aHBiOkNCeXU0aUlCSGRWZEZ4RA==';
  END IF;

  -- Call ZeeDatabase API
  SELECT *
  INTO api_response
  FROM extensions.http((
    'GET',
    'https://zee-database-api.horsepowerbrands.com/database',
    ARRAY[extensions.http_header('Authorization', 'Basic ' || auth_token)],
    NULL,
    NULL
  )::extensions.http_request);

  IF api_response.status <> 200 THEN
    RETURN jsonb_build_object(
      'error', true,
      'message', format('API returned HTTP %s', api_response.status)
    );
  END IF;

  locations := api_response.content::jsonb;

  -- Process each Gatsby Glass location
  FOR loc IN SELECT * FROM jsonb_array_elements(locations)
  LOOP
    IF loc->>'Brand' = 'Gatsby Glass' THEN
      loc_email := lower(trim(loc->>'SharedInboxEmailAddress'));
      loc_id    := trim(loc->>'Title');
      loc_name  := trim(loc->>'TerritoryName');

      IF loc_email IS NOT NULL AND loc_email <> '' THEN
        IF loc->>'OperationStatus' = 'Operating' THEN
          api_emails := array_append(api_emails, loc_email);

          INSERT INTO team_locations (email, location_id, location_name, is_active)
          VALUES (loc_email, loc_id, loc_name, true)
          ON CONFLICT (email) DO UPDATE SET
            location_id   = EXCLUDED.location_id,
            location_name = EXCLUDED.location_name,
            is_active     = true
          RETURNING (xmax = 0)::int INTO was_insert;

          IF was_insert = 1 THEN
            cnt_inserted := cnt_inserted + 1;
          ELSE
            cnt_updated := cnt_updated + 1;
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Deactivate Gatsby Glass locations no longer in "Operating" status
  WITH deactivated_rows AS (
    UPDATE team_locations
    SET is_active = false
    WHERE email LIKE '%@gatsbyglass.com'
      AND is_active = true
      AND lower(email) <> ALL(api_emails)
    RETURNING 1
  )
  SELECT count(*) INTO deactivated FROM deactivated_rows;

  RETURN jsonb_build_object(
    'success',     true,
    'inserted',    cnt_inserted,
    'updated',     cnt_updated,
    'total_synced', array_length(api_emails, 1),
    'deactivated', deactivated,
    'run_at',      now()
  );
END;
$$;

-- 4. Run once manually to verify ----------------------------------------------
-- Uncomment and run this to test before scheduling:

-- SELECT sync_gatsby_glass_locations();

-- Expected output (first run):
-- {"success": true, "inserted": 39, "updated": 0, "total_synced": 39, "deactivated": 0, "run_at": "..."}

-- Verify the data:
-- SELECT email, location_id, location_name, is_active FROM team_locations ORDER BY location_id;

-- 5. Schedule daily at 6 AM UTC -----------------------------------------------
-- pg_cron must be enabled in your Supabase project (Dashboard > Database > Extensions).
-- Uncomment and run after verifying step 4:

-- SELECT cron.schedule(
--   'sync-gatsby-locations',
--   '0 6 * * *',
--   $$ SELECT sync_gatsby_glass_locations(); $$
-- );

-- To check scheduled jobs:  SELECT * FROM cron.job;
-- To view run history:      SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
-- To unschedule:            SELECT cron.unschedule('sync-gatsby-locations');
