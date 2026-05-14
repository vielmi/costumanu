-- Theater Locations: multiple storage locations per theater

CREATE TABLE IF NOT EXISTS theater_locations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theater_id   UUID NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  street       TEXT,
  zip          TEXT,
  city         TEXT,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE theater_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theater_members_view_locations"
  ON theater_locations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM theater_members tm
      WHERE tm.theater_id = theater_locations.theater_id
        AND tm.user_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "theater_admins_manage_locations"
  ON theater_locations FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM theater_members tm
      WHERE tm.theater_id = theater_locations.theater_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
    OR is_platform_admin()
  );

-- Reference from costume_items to the chosen location
ALTER TABLE costume_items
  ADD COLUMN IF NOT EXISTS theater_location_id UUID REFERENCES theater_locations(id) ON DELETE SET NULL;

