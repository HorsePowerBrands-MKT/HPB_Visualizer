-- Migration 009: Track TCPA consent on lead records
-- Run this in the Supabase SQL editor.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS tcpa_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tcpa_consent_at TIMESTAMPTZ;
