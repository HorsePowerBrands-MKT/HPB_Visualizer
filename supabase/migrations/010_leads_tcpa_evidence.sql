-- Migration 010: Store full TCPA consent evidence on lead records
-- Run this in the Supabase SQL editor.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS tcpa_consent_text TEXT,
  ADD COLUMN IF NOT EXISTS consent_ip TEXT,
  ADD COLUMN IF NOT EXISTS consent_user_agent TEXT;
