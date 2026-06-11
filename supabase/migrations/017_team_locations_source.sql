-- Migration 017: Track row provenance on team_locations
-- Run this in the Supabase SQL editor.
--
-- This migration does two things:
--   1. Adds a `source` column to team_locations distinguishing rows managed by
--      the daily ZeeDatabase sync ('sync') from rows created by hand or via
--      the admin user-management UI ('manual').
--   2. Updates sync_gatsby_glass_locations() so the daily deactivation sweep
--      only touches source = 'sync' rows. Without this, a manually added
--      @gatsbyglass.com user assigned to a 'GG-%' location would be
--      deactivated every night because their email isn't returned by the
--      ZeeDatabase API.

-- 1. Add and backfill the source column ---------------------------------------

ALTER TABLE team_locations
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- Existing franchise rows were created by the sync; corporate rows (and any
-- other non-franchise rows) stay 'manual'.
UPDATE team_locations
SET source = 'sync'
WHERE location_id LIKE 'GG-%';

-- 2. Update sync function ------------------------------------------------------
--
-- Replaces the function from migration 016. Behavior changes:
--   - The upsert marks rows it manages with source = 'sync' (including on
--     conflict: if a manually added email later appears in the API, the sync
--     takes ownership of it).
--   - The deactivation sweep adds AND source = 'sync' so manual rows are
--     never auto-deactivated.

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
  zip_raw      text;
  zip_lines    text[];
  zip_val      text;
  api_emails   text[] := '{}';
  api_loc_ids  text[] := '{}';
  was_insert   int;
  cnt_inserted int := 0;
  cnt_updated  int := 0;
  deactivated  int := 0;
  zips_upserted int := 0;
  zips_removed  int := 0;
  overlap_zips  jsonb;
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
          api_emails  := array_append(api_emails, loc_email);
          api_loc_ids := array_append(api_loc_ids, loc_id);

          -- Upsert team_locations, marking the row as sync-managed
          INSERT INTO team_locations (email, location_id, location_name, is_active, source)
          VALUES (loc_email, loc_id, loc_name, true, 'sync')
          ON CONFLICT (email) DO UPDATE SET
            location_id   = EXCLUDED.location_id,
            location_name = EXCLUDED.location_name,
            is_active     = true,
            source        = 'sync'
          RETURNING (xmax = 0)::int INTO was_insert;

          IF was_insert = 1 THEN
            cnt_inserted := cnt_inserted + 1;
          ELSE
            cnt_updated := cnt_updated + 1;
          END IF;

          -- Parse ZipCodeList (newline-delimited) and upsert territory_zipcodes
          zip_raw := loc->>'ZipCodeList';
          IF zip_raw IS NOT NULL AND zip_raw <> '' THEN
            zip_lines := string_to_array(zip_raw, E'\n');
            FOREACH zip_val IN ARRAY zip_lines
            LOOP
              zip_val := trim(zip_val);
              IF zip_val <> '' AND zip_val ~ '^\d{5}$' THEN
                INSERT INTO territory_zipcodes (zip_code, location_id)
                VALUES (zip_val, loc_id)
                ON CONFLICT (zip_code, location_id) DO NOTHING;

                zips_upserted := zips_upserted + 1;
              END IF;
            END LOOP;
          END IF;

        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Deactivate Gatsby Glass franchise team_locations no longer in "Operating"
  -- status. Scoped to sync-managed rows only, so manually added users
  -- (corporate or franchise) are never touched by this sweep.
  WITH deactivated_rows AS (
    UPDATE team_locations
    SET is_active = false
    WHERE email LIKE '%@gatsbyglass.com'
      AND is_active = true
      AND location_id LIKE 'GG-%'
      AND source = 'sync'
      AND lower(email) <> ALL(api_emails)
    RETURNING 1
  )
  SELECT count(*) INTO deactivated FROM deactivated_rows;

  -- Remove territory_zipcodes for Gatsby Glass locations that are no longer operating
  WITH removed_zips AS (
    DELETE FROM territory_zipcodes tz
    WHERE tz.location_id LIKE 'GG-%'
      AND tz.location_id <> ALL(api_loc_ids)
    RETURNING 1
  )
  SELECT count(*) INTO zips_removed FROM removed_zips;

  -- Detect overlapping zipcodes (same zip assigned to multiple operating locations)
  SELECT coalesce(jsonb_agg(row_to_json(ov)), '[]'::jsonb)
  INTO overlap_zips
  FROM (
    SELECT tz.zip_code, array_agg(tz.location_id ORDER BY tz.location_id) AS locations
    FROM territory_zipcodes tz
    WHERE tz.location_id LIKE 'GG-%'
      AND tz.location_id = ANY(api_loc_ids)
    GROUP BY tz.zip_code
    HAVING count(*) > 1
    LIMIT 50
  ) ov;

  RETURN jsonb_build_object(
    'success',        true,
    'inserted',       cnt_inserted,
    'updated',        cnt_updated,
    'total_synced',   array_length(api_emails, 1),
    'deactivated',    deactivated,
    'zips_upserted',  zips_upserted,
    'zips_removed',   zips_removed,
    'overlap_zips',   overlap_zips,
    'run_at',         now()
  );
END;
$$;

-- 3. Verification queries ---------------------------------------------------
--
-- Confirm the backfill:
--
-- SELECT source, count(*) FROM team_locations GROUP BY source;
--
-- Run the sync once and confirm manual rows were not deactivated:
-- SELECT sync_gatsby_glass_locations();
-- SELECT email, is_active FROM team_locations WHERE source = 'manual';
