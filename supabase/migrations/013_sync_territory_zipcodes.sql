-- Migration 013: Extend the Gatsby Glass sync to also populate territory_zipcodes
-- Run this in the Supabase SQL editor.
--
-- Replaces the sync_gatsby_glass_locations() function from migration 007.
-- Now also parses the ZipCodeList field (newline-delimited zip codes) from the
-- ZeeDatabase API and upserts them into territory_zipcodes.
-- Zipcodes for deactivated locations are removed automatically.
-- Overlapping zipcodes (shared by multiple operating locations) are logged.

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

          -- Upsert team_locations (same as before)
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

  -- Deactivate Gatsby Glass team_locations no longer in "Operating" status
  WITH deactivated_rows AS (
    UPDATE team_locations
    SET is_active = false
    WHERE email LIKE '%@gatsbyglass.com'
      AND is_active = true
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

-- To test manually:
-- SELECT sync_gatsby_glass_locations();

-- Verify territory_zipcodes:
-- SELECT zip_code, location_id FROM territory_zipcodes WHERE location_id LIKE 'GG-%' ORDER BY location_id, zip_code LIMIT 20;

-- Check for overlapping zips:
-- SELECT zip_code, array_agg(location_id) FROM territory_zipcodes WHERE location_id LIKE 'GG-%' GROUP BY zip_code HAVING count(*) > 1;
