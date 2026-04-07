-- ============================================================
-- Theater-specific taxonomy configuration
-- Adds optional theater_id to taxonomy_terms so each theater
-- can define its own terms per vocabulary in addition to globals.
-- ============================================================

ALTER TABLE taxonomy_terms
  ADD COLUMN IF NOT EXISTS theater_id UUID REFERENCES theaters(id) ON DELETE CASCADE;

-- Theater-specific terms: readable by theater members
CREATE POLICY "Members can read own theater taxonomy"
  ON taxonomy_terms FOR SELECT
  USING (
    theater_id IS NULL
    OR theater_id IN (
      SELECT theater_id FROM theater_members WHERE user_id = auth.uid()
    )
  );

-- Admins/owners can insert taxonomy terms for their theater
CREATE POLICY "Admins can insert taxonomy terms"
  ON taxonomy_terms FOR INSERT
  WITH CHECK (
    theater_id IN (
      SELECT theater_id FROM theater_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Admins/owners can update their theater's taxonomy terms
CREATE POLICY "Admins can update taxonomy terms"
  ON taxonomy_terms FOR UPDATE
  USING (
    theater_id IN (
      SELECT theater_id FROM theater_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Admins/owners can delete their theater's taxonomy terms
CREATE POLICY "Admins can delete taxonomy terms"
  ON taxonomy_terms FOR DELETE
  USING (
    theater_id IN (
      SELECT theater_id FROM theater_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
