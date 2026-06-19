#!/usr/bin/env node
// Loads US zip-code centroids from supabase/seed/us_zip_centroids.csv into the
// `zip_centroids` table (created by supabase/migrations/019_zip_centroids.sql).
//
// The centroids power the territory mileage buffer precomputed by
// sync_gatsby_glass_locations() and the nearest_franchise() RPC used to route
// out-of-territory quote leads.
//
// Usage (from repo root), after running migration 019:
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/seed-zip-centroids.mjs
//
// The CSV header must be: zip_code,lat,lng,city,state
// Lines starting with '#' and blank lines are ignored. Re-running is safe —
// rows are upserted on the zip_code primary key.
//
// Implemented against the Supabase REST (PostgREST) endpoint with the service
// key so it has no npm dependencies and runs with a bare `node` (>=18).

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const CSV_PATH = resolve(REPO_ROOT, 'supabase/seed/us_zip_centroids.csv');
const BATCH_SIZE = 1000;

// Lightweight .env loader (no dependency). Loads the first matching file so a
// plain `node`/`pnpm seed:zip-centroids` works without exporting vars by hand.
// Existing process.env values always win.
function loadEnvFiles() {
  const candidates = [
    resolve(REPO_ROOT, '.env.local'),
    resolve(REPO_ROOT, '.env'),
    resolve(REPO_ROOT, 'apps/gatsby-glass/.env.local'),
    resolve(REPO_ROOT, 'apps/gatsby-glass/.env'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      // Strip surrounding quotes if present.
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFiles();

const supabaseUrl = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''
).replace(/\/$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing SUPABASE_URL and/or SUPABASE_SERVICE_KEY environment variables.'
  );
  process.exit(1);
}

if (supabaseKey.includes('PASTE_YOUR_SERVICE')) {
  console.error(
    'SUPABASE_SERVICE_KEY is still the placeholder. Set the service_role / secret key\n' +
    '(Supabase Dashboard → Project Settings → API) in apps/gatsby-glass/.env.local, then re-run.'
  );
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const cols = line.split(',');
    const [zip, lat, lng] = cols;
    // Skip the header row.
    if (zip === 'zip_code') continue;

    const zipClean = (zip || '').trim();
    const latNum = Number.parseFloat(lat);
    const lngNum = Number.parseFloat(lng);
    if (!/^\d{5}$/.test(zipClean) || Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      continue;
    }

    rows.push({
      zip_code: zipClean,
      lat: latNum,
      lng: lngNum,
      city: (cols[3] || '').trim() || null,
      state: (cols[4] || '').trim() || null,
    });
  }
  return rows;
}

async function upsertBatch(batch) {
  const res = await fetch(`${supabaseUrl}/rest/v1/zip_centroids`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      // Upsert on the primary key (zip_code) and don't return rows.
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(batch),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
}

async function main() {
  const csv = readFileSync(CSV_PATH, 'utf8');
  const rows = parseCsv(csv);

  if (rows.length === 0) {
    console.error(`No valid rows parsed from ${CSV_PATH}`);
    process.exit(1);
  }

  console.log(`Parsed ${rows.length} zip centroids from ${CSV_PATH}`);

  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await upsertBatch(batch);
    upserted += batch.length;
    console.log(`Upserted ${upserted}/${rows.length}`);
  }

  console.log(`Done. ${upserted} zip centroids loaded.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
