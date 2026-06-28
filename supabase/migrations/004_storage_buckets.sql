-- ============================================================
-- Migration 004: Create media storage bucket
-- ============================================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the media bucket
CREATE POLICY "Users can upload their own media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (auth.uid() = owner OR owner IS NULL)
);

CREATE POLICY "Users can view their own media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media' AND
  auth.uid() = owner
);

CREATE POLICY "Users can delete their own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  auth.uid() = owner
);
