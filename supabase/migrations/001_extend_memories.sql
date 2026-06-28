-- ============================================================
-- Migration 001: Extend memories table with mymind-like fields
-- Safe: additive only. All columns use IF NOT EXISTS.
-- Run this in Supabase SQL Editor > New query > Run
-- ============================================================

ALTER TABLE memories
  -- Rich content fields
  ADD COLUMN IF NOT EXISTS body             text,
  ADD COLUMN IF NOT EXISTS summary          text,

  -- Source / provenance
  ADD COLUMN IF NOT EXISTS source_url       text,
  ADD COLUMN IF NOT EXISTS source_domain    text,
  ADD COLUMN IF NOT EXISTS source_title     text,
  ADD COLUMN IF NOT EXISTS author           text,
  ADD COLUMN IF NOT EXISTS published_at     timestamptz,

  -- Media references
  ADD COLUMN IF NOT EXISTS image_url        text,
  ADD COLUMN IF NOT EXISTS thumbnail_url    text,
  ADD COLUMN IF NOT EXISTS file_url         text,
  ADD COLUMN IF NOT EXISTS video_url        text,

  -- Extracted text
  ADD COLUMN IF NOT EXISTS plain_text       text,
  ADD COLUMN IF NOT EXISTS ocr_text         text,
  ADD COLUMN IF NOT EXISTS visual_description text,

  -- Tagging
  ADD COLUMN IF NOT EXISTS tags             text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_tags          text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS user_tags        text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dominant_colors  text[]    DEFAULT '{}',

  -- Surface / discovery flags
  ADD COLUMN IF NOT EXISTS is_pinned        boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_top_of_mind   boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS top_of_mind_order int,

  -- Read tracking
  ADD COLUMN IF NOT EXISTS is_read          boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at          timestamptz,

  -- Soft delete
  ADD COLUMN IF NOT EXISTS deleted_at       timestamptz,

  -- Capture metadata
  ADD COLUMN IF NOT EXISTS capture_source   text      DEFAULT 'web_app',
  ADD COLUMN IF NOT EXISTS processing_status text     DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS processing_error text,
  ADD COLUMN IF NOT EXISTS metadata         jsonb     DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extension_metadata jsonb   DEFAULT '{}',

  -- Timestamps
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz DEFAULT now();

-- Keep updated_at in sync automatically
CREATE OR REPLACE FUNCTION memories_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS memories_updated_at ON memories;
CREATE TRIGGER memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION memories_set_updated_at();

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_memories_user_archived
  ON memories (user_id, archived) WHERE archived = false;

CREATE INDEX IF NOT EXISTS idx_memories_user_top_of_mind
  ON memories (user_id, is_top_of_mind, top_of_mind_order)
  WHERE is_top_of_mind = true;

CREATE INDEX IF NOT EXISTS idx_memories_user_pinned
  ON memories (user_id, is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_memories_user_type
  ON memories (user_id, type);

CREATE INDEX IF NOT EXISTS idx_memories_processing_status
  ON memories (user_id, processing_status)
  WHERE processing_status != 'completed';

-- Full-text search index across key text fields
CREATE INDEX IF NOT EXISTS idx_memories_fts
  ON memories USING gin(
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(excerpt, '') || ' ' ||
      coalesce(body, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(plain_text, '') || ' ' ||
      coalesce(ocr_text, '')
    )
  );
