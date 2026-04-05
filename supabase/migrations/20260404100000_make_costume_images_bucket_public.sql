-- ============================================================
-- Make costume-images bucket public so getPublicUrl() works
-- ============================================================

-- Create bucket if it doesn't exist yet (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'costume-images',
  'costume-images',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old private-only SELECT policy
DROP POLICY IF EXISTS "Theater members can view costume images" ON storage.objects;

-- Anyone can read (bucket is public)
CREATE POLICY "Public can view costume images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'costume-images');
