-- ============================================================
-- MIGRATION: Tier-Gate für field_definitions (BC §5c / §12)
-- ============================================================
-- Problem: Jedes Theater konnte bisher eigene Felder definieren,
-- unabhängig vom Subscription-Tier.
-- Fix: Schreib-Zugriff (INSERT/UPDATE/DELETE) auf field_definitions
-- erfordert has_feature(theater_id, 'custom_fields') → Standard+.
-- SELECT bleibt für alle Theater-Mitglieder offen (Formular-Rendering).
-- ============================================================

DROP POLICY IF EXISTS "Owner/admin can manage field definitions" ON field_definitions;

CREATE POLICY "Owner/admin can manage field definitions"
  ON field_definitions FOR ALL
  USING (
    is_platform_admin()
    OR (
      has_feature(theater_id, 'custom_fields')
      AND EXISTS (
        SELECT 1 FROM theater_members tm
        WHERE tm.theater_id = field_definitions.theater_id
          AND tm.user_id    = auth.uid()
          AND tm.role IN ('owner', 'admin')
      )
    )
  )
  WITH CHECK (
    is_platform_admin()
    OR (
      has_feature(theater_id, 'custom_fields')
      AND EXISTS (
        SELECT 1 FROM theater_members tm
        WHERE tm.theater_id = field_definitions.theater_id
          AND tm.user_id    = auth.uid()
          AND tm.role IN ('owner', 'admin')
      )
    )
  );
