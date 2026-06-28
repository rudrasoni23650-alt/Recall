-- ============================================================
-- Migration 005: Extract existing spaces from user_metadata
-- Run this in Supabase SQL Editor > New query > Run
-- ============================================================

-- This script safely inserts spaces that were previously stored in user_metadata
-- into the new spaces table.
INSERT INTO spaces (id, user_id, name, description, eyebrow, number, memory_ids, reminder_ids, created_at, updated_at)
SELECT
  (space->>'id')::uuid AS id,
  id AS user_id,
  space->>'title' AS name,
  space->>'text' AS description,
  space->>'eyebrow' AS eyebrow,
  space->>'number' AS number,
  ARRAY(SELECT jsonb_array_elements_text(space->'memoryIds'))::uuid[] AS memory_ids,
  ARRAY(SELECT jsonb_array_elements_text(space->'reminderIds'))::uuid[] AS reminder_ids,
  now() AS created_at,
  now() AS updated_at
FROM auth.users,
jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(raw_user_meta_data->'spaces') = 'array' THEN raw_user_meta_data->'spaces'
    ELSE '[]'::jsonb
  END
) AS space
ON CONFLICT (id) DO NOTHING;
