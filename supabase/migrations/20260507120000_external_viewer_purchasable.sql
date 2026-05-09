-- ============================================================
-- MIGRATION: Externer Viewer + Kaufbar-Flag
-- ============================================================
-- 1. Suchmodus erfordert neu einen Account (kein anonymer Zugriff mehr).
--    Die TO anon-Policies aus Migration 20260409 werden entfernt.
--    Ersatz: bestehende "TO authenticated"-Policies aus dem Initial-Schema
--    greifen bereits für eingeloggte externe User.
--
-- 2. is_purchasable-Flag auf costume_network_visibility.
--    Trennt Kaufbarkeit von Ausleihbarkeit (analog zu is_lendable).
-- ============================================================

-- ============================================================
-- 1. ANONYMEN ZUGRIFF ENTFERNEN (Suchmodus = Login erforderlich)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view public costumes"       ON costumes;
DROP POLICY IF EXISTS "Anyone can view public costume taxonomy" ON costume_taxonomy;
DROP POLICY IF EXISTS "Anyone can view public costume media"  ON costume_media;
DROP POLICY IF EXISTS "Anyone can view public costume provenance" ON costume_provenance;

-- Externe Viewer (eingeloggt, kein Theater) brauchen Lesezugriff
-- auf öffentliche Kostüme. Die bestehenden "Public costumes visible
-- to all authenticated"-Policies aus dem Initial-Schema decken das bereits ab.
-- Für costume_taxonomy, costume_media und costume_provenance fehlen
-- analoge authenticated-Policies — diese werden hier ergänzt:

CREATE POLICY "Authenticated can view public costume taxonomy"
  ON costume_taxonomy FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM costume_items ci
      WHERE ci.costume_id = costume_taxonomy.costume_id
        AND ci.is_public_for_rent = true
    )
  );

CREATE POLICY "Authenticated can view public costume media"
  ON costume_media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM costume_items ci
      WHERE ci.costume_id = costume_media.costume_id
        AND ci.is_public_for_rent = true
    )
  );

CREATE POLICY "Authenticated can view public costume provenance"
  ON costume_provenance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM costume_items ci
      WHERE ci.costume_id = costume_provenance.costume_id
        AND ci.is_public_for_rent = true
    )
  );

-- ============================================================
-- 2. IS_PURCHASABLE FLAG
-- ============================================================
-- Ermöglicht es Theatern, Kostüme als käuflich zu markieren
-- (unabhängig von is_lendable). Default: false.

ALTER TABLE costume_network_visibility
  ADD COLUMN IF NOT EXISTS is_purchasable BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN costume_network_visibility.is_purchasable IS
  'Ob das Kostüm von anderen Netzwerk-Theatern gekauft werden kann. '
  'Unabhängig von is_lendable. Setzt is_visible = true voraus. Default: false.';

-- Helper-Funktion: prüft ob Kostüm kaufbar für ein bestimmtes Theater
CREATE OR REPLACE FUNCTION costume_purchasable_to_theater(
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
    WHERE cnv.costume_id     = p_costume_id
      AND cnv.is_visible     = true
      AND cnv.is_purchasable = true
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
