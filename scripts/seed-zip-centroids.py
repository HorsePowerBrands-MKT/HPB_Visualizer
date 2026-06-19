#!/usr/bin/env python3
"""
Loads US zip-code centroids from supabase/seed/us_zip_centroids.csv into the
`zip_centroids` table (created by supabase/migrations/019_zip_centroids.sql).

Usage (from repo root):
  python3 scripts/seed-zip-centroids.py

Reads SUPABASE_URL and SUPABASE_SERVICE_KEY from (in order of priority):
  process environment → apps/gatsby-glass/.env.local → .env.local → .env
"""

import csv
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CSV_PATH  = REPO_ROOT / "supabase" / "seed" / "us_zip_centroids.csv"
BATCH_SIZE = 1000


def load_env_files():
    candidates = [
        REPO_ROOT / ".env.local",
        REPO_ROOT / ".env",
        REPO_ROOT / "apps" / "gatsby-glass" / ".env.local",
        REPO_ROOT / "apps" / "gatsby-glass" / ".env",
    ]
    for path in candidates:
        if not path.exists():
            continue
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                key, _, val = line.partition("=")
                key = key.strip()
                val = val.strip().strip("\"'")
                if key and key not in os.environ:
                    os.environ[key] = val


def parse_csv(path):
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            break  # first non-comment line is the header

        reader = csv.DictReader(f, fieldnames=["zip_code","lat","lng","city","state"])
        for row in reader:
            z = (row.get("zip_code") or "").strip()
            lat_s = (row.get("lat") or "").strip()
            lng_s = (row.get("lng") or "").strip()
            if not z or z == "zip_code":
                continue
            if len(z) != 5 or not z.isdigit():
                continue
            try:
                lat = float(lat_s)
                lng = float(lng_s)
            except ValueError:
                continue
            rows.append({
                "zip_code": z,
                "lat": lat,
                "lng": lng,
                "city": (row.get("city") or "").strip() or None,
                "state": (row.get("state") or "").strip() or None,
            })
    return rows


def upsert_batch(url, key, batch):
    endpoint = f"{url.rstrip('/')}/rest/v1/zip_centroids"
    data = json.dumps(batch).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status not in (200, 201, 204):
                body = resp.read().decode()
                print(f"Unexpected status {resp.status}: {body}", file=sys.stderr)
                sys.exit(1)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP {e.code}: {body}", file=sys.stderr)
        sys.exit(1)


def main():
    load_env_files()

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY", "")

    if not supabase_url or not supabase_key:
        print("Missing SUPABASE_URL and/or SUPABASE_SERVICE_KEY.", file=sys.stderr)
        print("Set them in apps/gatsby-glass/.env.local", file=sys.stderr)
        sys.exit(1)

    if "PASTE_YOUR_SERVICE" in supabase_key:
        print("SUPABASE_SERVICE_KEY is still the placeholder.", file=sys.stderr)
        print("Paste your service_role / secret key in apps/gatsby-glass/.env.local", file=sys.stderr)
        sys.exit(1)

    rows = parse_csv(CSV_PATH)
    if not rows:
        print(f"No valid rows parsed from {CSV_PATH}", file=sys.stderr)
        sys.exit(1)

    print(f"Parsed {len(rows)} zip centroids from {CSV_PATH}")

    upserted = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        upsert_batch(supabase_url, supabase_key, batch)
        upserted += len(batch)
        print(f"Upserted {upserted}/{len(rows)}")

    print(f"Done. {upserted} zip centroids loaded.")


if __name__ == "__main__":
    main()
