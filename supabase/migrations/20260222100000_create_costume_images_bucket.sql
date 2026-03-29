-- ============================================================
-- Storage bucket for costume images
-- Path convention: {theater_id}/{costume_id}/{filename}
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'costume-images',
  'costume-images',
  false,
  52428800, -- 50 MiB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS policies
-- Theater members can upload/view/delete images in their theater folder
-- ============================================================

CREATE POLICY "Theater members can upload costume images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'costume-images'
    AND is_member_of((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Theater members can view costume images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'costume-images'
    AND is_member_of((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Theater members can delete costume images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'costume-images'
    AND is_member_of((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Theater members can update costume images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'costume-images'
    AND is_member_of((storage.foldername(name))[1]::uuid)
  );
