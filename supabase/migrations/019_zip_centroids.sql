-- Migration 019: US zip-code centroid lookup table
-- Run this in the Supabase SQL editor.
--
-- Stores an approximate geographic centroid (lat/lng) for every US 5-digit
-- zip code. Used by the territory sync to precompute a configurable mileage
-- buffer around each franchise's zip codes, and by the app to find the
-- nearest franchise for leads that fall outside every territory.
--
-- The data is loaded separately from a committed dataset via
-- `scripts/seed-zip-centroids.mjs` (see supabase/seed/us_zip_centroids.csv).

CREATE TABLE IF NOT EXISTS zip_centroids (
  zip_code   TEXT             NOT NULL PRIMARY KEY,
  lat        DOUBLE PRECISION NOT NULL,
  lng        DOUBLE PRECISION NOT NULL,
  city       TEXT,
  state      TEXT,
  created_at TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Bounding-box prefilter index for the Haversine passes in the sync and the
-- nearest_franchise() RPC. A plain btree on (lat, lng) lets Postgres range
-- scan the latitude band cheaply before the per-row distance math.
CREATE INDEX IF NOT EXISTS idx_zip_centroids_lat_lng
  ON zip_centroids (lat, lng);

-- 3. Verification queries ---------------------------------------------------
--
-- Confirm the seed loaded:
-- SELECT count(*) FROM zip_centroids;
-- SELECT * FROM zip_centroids WHERE zip_code = '78701';
