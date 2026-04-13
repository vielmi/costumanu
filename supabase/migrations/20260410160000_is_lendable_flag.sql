-- ============================================================
-- MIGRATION: is_lendable Flag auf costume_network_visibility
-- ============================================================
-- Trennt Sichtbarkeit (is_visible) von Ausleihbarkeit (is_lendable).
-- Default: is_lendable = is_visible (bestehende Semantik bleibt erhalten).
-- Ermöglicht später: Kostüm ist sichtbar, aber nicht ausleihbar.
-- ============================================================

ALTER TABLE costume_network_visibility
  ADD COLUMN IF NOT EXISTS is_lendable BOOLEAN NOT NULL DEFAULT true;

-- Bestehende Einträge: is_lendable = is_visible
UPDATE costume_network_visibility
SET is_lendable = is_visible;

COMMENT ON COLUMN costume_network_visibility.is_lendable IS
  'Ob das Kostüm von anderen Netzwerk-Theatern ausgeliehen werden kann. '
  'Setzt is_visible = true voraus. Default: true (= ausleihbar wenn sichtbar).';

-- Helper-Funktion erweitern: Sichtbarkeit UND Ausleihbarkeit prüfen
CREATE OR REPLACE FUNCTION costume_lendable_to_theater(
  p_costume_id     UUID,
  p_viewer_theater UUID
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM costume_network_visibility cnv
    JOIN theater_network_members lender_nm
      ON lender_nm.network_id = cnv.network_id
    JOIN theater_network_members viewer_nm
      ON viewer_nm.network_id = cnv.network_id
    JOIN costumes c ON c.id = cnv.costume_id
    WHERE cnv.costume_id   = p_costume_id
      AND cnv.is_visible   = true
      AND cnv.is_lendable  = true
      AND viewer_nm.theater_id = p_viewer_theater
      AND lender_nm.theater_id = c.theater_id
      AND NOT EXISTS (
        SELECT 1 FROM theater_network_restrictions tnr
        WHERE tnr.network_id        = cnv.network_id
          AND tnr.lender_theater_id = c.theater_id
          AND tnr.viewer_theater_id = p_viewer_theater
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
