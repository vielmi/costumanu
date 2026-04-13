-- ============================================================
-- MIGRATION: Fix — bootstrap_personal_theater idempotent
-- ============================================================
-- Problem: Wenn die theater_members-Query durch einen RLS-Fehler
-- keine Zeilen zurückgibt, wird bootstrap_personal_theater
-- erneut aufgerufen. Das scheitert mit "duplicate key value
-- violates unique constraint theaters_slug_key" (Code 23505),
-- weil Theater + Slug bereits existieren.
--
-- Fix: ON CONFLICT-Logik in beiden INSERTs, sodass die
-- Funktion idempotent ist und immer die korrekte theater_id
-- zurückgibt — egal ob Theater + Mitgliedschaft neu oder
-- bereits vorhanden.
-- ============================================================

CREATE OR REPLACE FUNCTION bootstrap_personal_theater(p_name TEXT, p_slug TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_theater_id UUID;
BEGIN
  -- Theater anlegen oder vorhandenes ignorieren
  INSERT INTO theaters (name, slug)
  VALUES (p_name, p_slug)
  ON CONFLICT (slug) DO NOTHING;

  -- Immer die ID des vorhandenen Theaters holen
  SELECT id INTO v_theater_id FROM theaters WHERE slug = p_slug;

  -- Mitgliedschaft anlegen, ignorieren falls schon vorhanden
  INSERT INTO theater_members (theater_id, user_id, role)
  VALUES (v_theater_id, auth.uid(), 'owner')
  ON CONFLICT DO NOTHING;

  RETURN v_theater_id;
END;
$$;
