-- Migration 015: API call logging for usage tracking
-- Run this in the Supabase SQL editor.
--
-- Records every meaningful API call so super_admins can see a breakdown
-- of image validations, generations (initial vs update), lead submissions,
-- issue reports, and image uploads.

CREATE TABLE IF NOT EXISTS api_call_log (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  call_type    TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_call_log_type_date
  ON api_call_log (call_type, created_at);
