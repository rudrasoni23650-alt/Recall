-- ============================================================
-- Migration 003: Enable RLS and add per-user access policies
-- Run after 001 and 002.
-- ============================================================

-- ─── memories ─────────────────────────────────────────────────────────────────
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own memories" ON memories;
CREATE POLICY "Users can manage their own memories"
  ON memories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── reminders ────────────────────────────────────────────────────────────────
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own reminders" ON reminders;
CREATE POLICY "Users can manage their own reminders"
  ON reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── highlights ───────────────────────────────────────────────────────────────
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own highlights" ON highlights;
CREATE POLICY "Users can manage their own highlights"
  ON highlights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── memory_links ─────────────────────────────────────────────────────────────
ALTER TABLE memory_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own memory links" ON memory_links;
CREATE POLICY "Users can manage their own memory links"
  ON memory_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── extension_tokens ─────────────────────────────────────────────────────────
ALTER TABLE extension_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own extension tokens" ON extension_tokens;
CREATE POLICY "Users can manage their own extension tokens"
  ON extension_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── processing_jobs ──────────────────────────────────────────────────────────
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own processing jobs" ON processing_jobs;
CREATE POLICY "Users can view their own processing jobs"
  ON processing_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Backend uses service role for inserts/updates on processing_jobs
-- so no INSERT/UPDATE policy needed for anon key access.

-- ─── spaces ───────────────────────────────────────────────────────────────────
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own spaces" ON spaces;
CREATE POLICY "Users can manage their own spaces"
  ON spaces FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Storage bucket policies (run separately in Supabase dashboard) ───────────
-- After creating buckets: memory-images, memory-files, memory-audio
-- Add the following policies to each bucket via the Storage > Policies UI:
--
--   Policy name: "User private access"
--   Allowed operation: All (SELECT, INSERT, UPDATE, DELETE)
--   Policy definition: (auth.uid())::text = (storage.foldername(name))[1]
--
-- This enforces that users can only access files under their own user_id folder.
