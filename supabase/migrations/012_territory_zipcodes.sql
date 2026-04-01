-- Migration 012: Territory zipcodes lookup table + location columns on leads
-- Run this in the Supabase SQL editor.
--
-- Creates a zipcode-to-location mapping table so incoming leads can be
-- automatically routed to the correct franchise territory.

-- 1. territory_zipcodes — maps 5-digit zip codes to team_locations entries
CREATE TABLE IF NOT EXISTS territory_zipcodes (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  zip_code        TEXT        NOT NULL,
  location_id     TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_territory_zipcodes_zip_loc
  ON territory_zipcodes (zip_code, location_id);

CREATE INDEX IF NOT EXISTS idx_territory_zipcodes_zip
  ON territory_zipcodes (zip_code);

-- 2. Add location columns to leads so every lead records which franchise it
--    was routed to. Leads with unmatched zips get 'NO_TERRITORY' / 'No Territory'.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS location_id   TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS location_name TEXT;
