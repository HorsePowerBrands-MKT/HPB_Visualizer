-- Migration 021: Include launch-phase franchises in the location sync
-- Run this in the Supabase SQL editor (after migration 020).
--
-- Problem this fixes:
--   sync_gatsby_glass_locations() only created a location when
--   OperationStatus = 'Operating'. Newly launching franchises (e.g. DuPage
--   County, IL / GG-161) have OperationStatus = null and Status = 'Phase 2',
--   so they were skipped even though they have a shared inbox email, a
--   territory name, and a ZipCodeList.
--
-- New creation/activation gate (all must be true):
--   1. Brand = 'Gatsby Glass'
--   2. SharedInboxEmailAddress is non-empty (the email)
--   3. TerritoryName is non-empty (the "location")
--   4. OperationStatus = 'Operating'
--        OR (Status is present AND Status <> 'Closed')   -- Open / Phase 1 / Phase 2
--
--   This keeps every currently-synced Operating franchise (including the two
--   Operating rows whose Status is 'Closed'), adds launch-phase territories
--   like DuPage, and still excludes the 'Not Operating' / 'Closed' (DNO)
--   territories.
--
-- Only the creation gate changes vs. migration 020. The zip-code parse
-- (core + buffer geo phase), the deactivation sweep, and nearest_franchise()
-- are all unchanged. The deactivation sweep automatically follows the new
-- gate because it keys off api_emails, which is now built from the broadened
-- eligible set.

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
  loc_status   text;
  loc_opstat   text;
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
  buffer_zips   int := 0;
  overlap_zips  jsonb;
  auth_token   text;
  radius_miles double precision;
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

  -- Resolve the buffer radius from Vault, defaulting to 10 miles.
  BEGIN
    SELECT decrypted_secret::double precision INTO radius_miles
    FROM vault.decrypted_secrets
    WHERE name = 'territory_radius_miles'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    radius_miles := NULL;
  END;

  IF radius_miles IS NULL OR radius_miles <= 0 THEN
    radius_miles := 10;
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
      loc_email  := lower(trim(loc->>'SharedInboxEmailAddress'));
      loc_id     := trim(loc->>'Title');
      loc_name   := trim(loc->>'TerritoryName');
      loc_status := trim(loc->>'Status');
      loc_opstat := trim(loc->>'OperationStatus');

      -- Create/activate when there is an email AND a location (TerritoryName),
      -- and the franchise is either Operating or in an open/launch Status
      -- (anything other than 'Closed'). This includes launch phases such as
      -- 'Phase 1' / 'Phase 2' (e.g. DuPage) while still excluding closed/DNO
      -- territories.
      IF loc_email IS NOT NULL AND loc_email <> ''
         AND loc_name IS NOT NULL AND loc_name <> ''
         AND (
           loc_opstat = 'Operating'
           OR (loc_status IS NOT NULL AND loc_status <> '' AND loc_status <> 'Closed')
         ) THEN
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

          -- Parse ZipCodeList (newline-delimited) and upsert CORE territory_zipcodes
          zip_raw := loc->>'ZipCodeList';
          IF zip_raw IS NOT NULL AND zip_raw <> '' THEN
            zip_lines := string_to_array(zip_raw, E'\n');
            FOREACH zip_val IN ARRAY zip_lines
            LOOP
              zip_val := trim(zip_val);
              IF zip_val <> '' AND zip_val ~ '^\d{5}$' THEN
                INSERT INTO territory_zipcodes (zip_code, location_id, match_type, distance_miles)
                VALUES (zip_val, loc_id, 'core', 0)
                ON CONFLICT (zip_code, location_id) DO UPDATE SET
                  match_type = 'core';

                zips_upserted := zips_upserted + 1;
              END IF;
            END LOOP;
          END IF;

      END IF;
    END IF;
  END LOOP;

  -- Deactivate Gatsby Glass franchise team_locations no longer eligible
  -- (no longer returned by the gate above). Scoped to sync-managed rows only,
  -- so manually added users (corporate or franchise) are never touched by
  -- this sweep.
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

  -- Remove territory_zipcodes for Gatsby Glass locations that are no longer eligible
  WITH removed_zips AS (
    DELETE FROM territory_zipcodes tz
    WHERE tz.location_id LIKE 'GG-%'
      AND tz.location_id <> ALL(api_loc_ids)
    RETURNING 1
  )
  SELECT count(*) INTO zips_removed FROM removed_zips;

  -- ===== Geo phase: recompute buffer zips + distances ======================
  -- Clear previously computed buffer rows for GG franchises; they're rebuilt
  -- below from the current core set and radius.
  DELETE FROM territory_zipcodes
  WHERE match_type = 'buffer'
    AND location_id LIKE 'GG-%';

  -- Core zips joined to their centroids.
  DROP TABLE IF EXISTS _core_geo;
  CREATE TEMP TABLE _core_geo AS
    SELECT tz.location_id, tz.zip_code, zc.lat, zc.lng
    FROM territory_zipcodes tz
    JOIN zip_centroids zc ON zc.zip_code = tz.zip_code
    WHERE tz.match_type = 'core'
      AND tz.location_id LIKE 'GG-%';

  -- Per-franchise representative centroid + bounding box of its core zips.
  DROP TABLE IF EXISTS _fc;
  CREATE TEMP TABLE _fc AS
    SELECT location_id,
           avg(lat) AS lat,
           avg(lng) AS lng,
           min(lat) AS min_lat,
           max(lat) AS max_lat,
           min(lng) AS min_lng,
           max(lng) AS max_lng
    FROM _core_geo
    GROUP BY location_id;

  -- Stamp distance on core rows = distance from the core zip to the centroid.
  UPDATE territory_zipcodes tz
  SET distance_miles = miles_between(cg.lat, cg.lng, fc.lat, fc.lng)
  FROM _core_geo cg
  JOIN _fc fc ON fc.location_id = cg.location_id
  WHERE tz.match_type = 'core'
    AND tz.location_id = cg.location_id
    AND tz.zip_code   = cg.zip_code;

  -- Insert buffer zips: any zip within `radius_miles` of one of the franchise's
  -- core zips (bounding-box prefilter, then exact Haversine), excluding zips
  -- already covered (core or buffer) by that franchise. distance_miles ranks by
  -- closeness to the franchise centroid so the nearest franchise wins.
  WITH inserted AS (
    INSERT INTO territory_zipcodes (zip_code, location_id, match_type, distance_miles)
    SELECT b.zip_code, b.location_id, 'buffer', b.dist
    FROM (
      SELECT zc.zip_code,
             fc.location_id,
             miles_between(zc.lat, zc.lng, fc.lat, fc.lng) AS dist
      FROM _fc fc
      JOIN zip_centroids zc
        ON zc.lat BETWEEN fc.min_lat - (radius_miles / 69.0)
                      AND fc.max_lat + (radius_miles / 69.0)
       AND zc.lng BETWEEN fc.min_lng - (radius_miles / (69.0 * GREATEST(cos(radians(fc.lat)), 0.2)))
                      AND fc.max_lng + (radius_miles / (69.0 * GREATEST(cos(radians(fc.lat)), 0.2)))
      WHERE EXISTS (
        SELECT 1
        FROM _core_geo cg
        WHERE cg.location_id = fc.location_id
          AND miles_between(zc.lat, zc.lng, cg.lat, cg.lng) <= radius_miles
      )
    ) b
    WHERE NOT EXISTS (
      SELECT 1 FROM territory_zipcodes ex
      WHERE ex.zip_code = b.zip_code
        AND ex.location_id = b.location_id
    )
    ON CONFLICT (zip_code, location_id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO buffer_zips FROM inserted;

  DROP TABLE IF EXISTS _core_geo;
  DROP TABLE IF EXISTS _fc;

  -- Detect overlapping zipcodes (same zip covered by multiple operating
  -- locations, whether core or buffer). Lookup resolves these by distance.
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
    'buffer_zips',    buffer_zips,
    'radius_miles',   radius_miles,
    'overlap_zips',   overlap_zips,
    'run_at',         now()
  );
END;
$$;

-- ============================================================================
-- Enable / verify the daily sync (pg_cron)
-- ============================================================================
-- The nightly job calls sync_gatsby_glass_locations() by name, so re-running
-- this migration is enough for the daily sync to pick up the new gate. Confirm
-- the schedule exists (it must be enabled once per Supabase project):
--
--   -- Is the daily job scheduled?
--   SELECT * FROM cron.job;
--
--   -- If it is missing, schedule it (6 AM UTC daily). pg_cron must be enabled
--   -- under Dashboard > Database > Extensions.
--   SELECT cron.schedule(
--     'sync-gatsby-locations',
--     '0 6 * * *',
--     $$ SELECT sync_gatsby_glass_locations(); $$
--   );
--
--   -- View recent run history:
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- ============================================================================
-- One-time backfill + verification (run once after applying this migration)
-- ============================================================================
--   SELECT sync_gatsby_glass_locations();
--
--   -- DuPage (GG-161) should now exist and be active:
--   SELECT * FROM team_locations WHERE location_id = 'GG-161';
--
--   -- Its directly-associated (core) zips plus computed buffer zips:
--   SELECT match_type, count(*)
--   FROM territory_zipcodes
--   WHERE location_id = 'GG-161'
--   GROUP BY match_type;
