-- Migration 008: Store all session visualization URLs on the lead record
-- Run this in the Supabase SQL editor.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS all_visualization_urls JSONB;
