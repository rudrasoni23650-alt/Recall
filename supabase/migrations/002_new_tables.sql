-- ============================================================
-- Migration 002: Create new tables for mymind-like features
-- Safe: all tables use IF NOT EXISTS.
-- Run after 001_extend_memories.sql
-- ============================================================

-- ─── highlights ───────────────────────────────────────────────────────────────
-- Stores text selections highlighted by the user in Reading Mode
CREATE TABLE IF NOT EXISTS highlights (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_id     uuid        REFERENCES memories(id) ON DELETE CASCADE,
  text          text        NOT NULL,
  note          text,
  source_url    text,
  source_title  text,
  color         text        DEFAULT 'yellow',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_highlights_user ON highlights (user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_memory ON highlights (memory_id);

-- ─── memory_links ─────────────────────────────────────────────────────────────
-- Explicit user-created or AI-suggested links between memories
CREATE TABLE IF NOT EXISTS memory_links (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_memory_id uuid        REFERENCES memories(id) ON DELETE CASCADE,
  target_memory_id uuid        REFERENCES memories(id) ON DELETE CASCADE,
  link_type        text        DEFAULT 'related',   -- 'related' | 'reference' | 'followup'
  created_at       timestamptz DEFAULT now(),
  UNIQUE (user_id, source_memory_id, target_memory_id)
);

CREATE INDEX IF NOT EXISTS idx_memory_links_user   ON memory_links (user_id);
CREATE INDEX IF NOT EXISTS idx_memory_links_source ON memory_links (source_memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_links_target ON memory_links (target_memory_id);

-- ─── extension_tokens ─────────────────────────────────────────────────────────
-- Browser extension auth tokens. Raw token shown once; only hash stored.
CREATE TABLE IF NOT EXISTS extension_tokens (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash   text        NOT NULL UNIQUE,
  name         text        DEFAULT 'Browser Extension',
  last_used_at timestamptz,
  created_at   timestamptz DEFAULT now(),
  revoked_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_extension_tokens_user ON extension_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_extension_tokens_hash ON extension_tokens (token_hash);

-- ─── processing_jobs ──────────────────────────────────────────────────────────
-- Async queue for AI processing (summarize, tag, OCR, metadata, etc.)
CREATE TABLE IF NOT EXISTS processing_jobs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_id  uuid        REFERENCES memories(id) ON DELETE CASCADE,
  job_type   text        NOT NULL,  -- 'summarize' | 'tag' | 'ocr' | 'metadata' | 'vision'
  status     text        DEFAULT 'pending',  -- 'pending' | 'running' | 'completed' | 'failed'
  error      text,
  metadata   jsonb       DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user        ON processing_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_memory      ON processing_jobs (memory_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status      ON processing_jobs (status) WHERE status IN ('pending', 'running');

CREATE OR REPLACE FUNCTION processing_jobs_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS processing_jobs_updated_at ON processing_jobs;
CREATE TRIGGER processing_jobs_updated_at
  BEFORE UPDATE ON processing_jobs
  FOR EACH ROW EXECUTE FUNCTION processing_jobs_set_updated_at();

-- ─── spaces ───────────────────────────────────────────────────────────────────
-- Persistent spaces (migrated from user_metadata to a proper table)
-- memory_ids and reminder_ids stored as arrays for simplicity (matches current app shape)
CREATE TABLE IF NOT EXISTS spaces (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number       text,
  eyebrow      text        DEFAULT 'Manual space',
  name         text        NOT NULL,
  description  text,
  icon         text,
  color        text,
  memory_ids   uuid[]      DEFAULT '{}',
  reminder_ids uuid[]      DEFAULT '{}',
  is_smart     boolean     DEFAULT false,
  query        text,
  filters      jsonb       DEFAULT '{}',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spaces_user ON spaces (user_id);

CREATE OR REPLACE FUNCTION spaces_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS spaces_updated_at ON spaces;
CREATE TRIGGER spaces_updated_at
  BEFORE UPDATE ON spaces
  FOR EACH ROW EXECUTE FUNCTION spaces_set_updated_at();
