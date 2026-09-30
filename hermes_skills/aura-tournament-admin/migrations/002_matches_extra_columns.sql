-- 002_matches_extra_columns.sql
-- Adds columns referenced by tournament/admin + judge routes that were missing
-- from the original 001 schema. Idempotent via IF NOT EXISTS on the add.

ALTER TABLE matches ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_user_id UUID;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS result_payload JSONB DEFAULT '{}'::jsonb;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS judge_override BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS override_reason TEXT;
