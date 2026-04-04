-- ── Migration 004: New pricing model ─────────────────────────────────────────
-- Replace old plan values (apply, family) with new model (guided, human_assisted)
-- Run in Supabase SQL Editor

-- 1. Drop existing plan constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- 2. Migrate existing plan values to new names
UPDATE profiles SET plan = 'guided'  WHERE plan = 'apply';
UPDATE profiles SET plan = 'locker'  WHERE plan = 'family';

-- 3. Add updated constraint with new plan names
ALTER TABLE profiles
ADD CONSTRAINT profiles_plan_check
CHECK (plan IN ('free', 'locker', 'guided', 'human_assisted'));

-- 4. Change default from 'locker' to 'free'
ALTER TABLE profiles
ALTER COLUMN plan SET DEFAULT 'free';
