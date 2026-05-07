-- ============================================================
-- MIGRATION: Costume Activity Log
-- ============================================================
-- Records a history entry on every costume save (create/edit).
-- Written directly from the client on handleSave.
-- ============================================================

CREATE TABLE costume_activity_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  costume_id       UUID NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  action_type      TEXT NOT NULL CHECK (action_type IN ('created', 'edited')),
  changed_by_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name  TEXT,
  changed_at       TIMESTAMPTZ DEFAULT now(),
  production_title TEXT,
  season           TEXT,
  role_name        TEXT,
  director_name    TEXT
);

CREATE INDEX idx_activity_log_costume_id  ON costume_activity_log(costume_id);
CREATE INDEX idx_activity_log_changed_at  ON costume_activity_log(changed_at DESC);

ALTER TABLE costume_activity_log ENABLE ROW LEVEL SECURITY;

-- Theater members can insert log entries for their costumes
CREATE POLICY "Members can insert activity log"
  ON costume_activity_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM costumes c
      WHERE c.id = costume_id AND is_member_of(c.theater_id)
    )
  );

-- Theater members can read log entries for their costumes
CREATE POLICY "Members can read activity log"
  ON costume_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM costumes c
      WHERE c.id = costume_id AND is_member_of(c.theater_id)
    )
  );
