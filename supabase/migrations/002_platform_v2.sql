-- ── Migration 002 — Platform v2 columns ──────────────────────────────────────
-- Run in Supabase SQL Editor.
-- All statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS for idempotency.

-- ── applications: new columns ─────────────────────────────────────────────────

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS registration_number   text,
  ADD COLUMN IF NOT EXISTS vfs_submitted_at      timestamptz,
  ADD COLUMN IF NOT EXISTS package_downloaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS tracking_number       text,
  ADD COLUMN IF NOT EXISTS portal_progress       jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS readiness_score       integer,
  ADD COLUMN IF NOT EXISTS validation_results    jsonb,
  ADD COLUMN IF NOT EXISTS prefill_coverage      integer,   -- 0-100
  ADD COLUMN IF NOT EXISTS prefill_sources       jsonb;     -- field_id → doc_type

-- Index on service_type for dashboard queries
CREATE INDEX IF NOT EXISTS idx_applications_service_type
  ON public.applications (service_type);

-- ── requirements_cache ────────────────────────────────────────────────────────
-- Drop and recreate: it is a cache table with no user data.
-- Safe to re-run at any time.

DROP TABLE IF EXISTS public.requirements_cache;

CREATE TABLE public.requirements_cache (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  text        NOT NULL,
  fetched_at  timestamptz NOT NULL DEFAULT now(),
  result      jsonb       NOT NULL
);

-- No RLS needed — public read-only data; writes go via service role only.

-- Index for fast cache lookup
CREATE INDEX idx_requirements_cache_service_id
  ON public.requirements_cache (service_id, fetched_at DESC);
