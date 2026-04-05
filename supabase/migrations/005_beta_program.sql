-- ── Migration 005: Beta program ──────────────────────────────────────────────
-- Adds beta tracking columns to profiles and a beta_counter singleton table
-- Also adds current_step for form progress save/resume

-- 1. Beta columns on profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_beta boolean DEFAULT false;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS beta_number integer;

-- 2. Beta counter singleton
CREATE TABLE IF NOT EXISTS beta_counter (
  id      integer PRIMARY KEY DEFAULT 1,
  count   integer DEFAULT 0,
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO beta_counter (id, count) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- 3. Form progress step on applications
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS current_step integer DEFAULT 0;

-- 4. RLS for beta_counter (read-only for authenticated users, write via service role)
ALTER TABLE beta_counter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read beta_counter" ON beta_counter;
CREATE POLICY "anyone can read beta_counter"
  ON beta_counter FOR SELECT
  USING (true);
