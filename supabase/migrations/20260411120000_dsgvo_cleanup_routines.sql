-- ============================================================
-- MIGRATION: DSGVO — Automatische Lösch-Routinen
-- ============================================================
-- Hilfsfunktionen für regelmässige Datenbereinigung:
--   1. Abgelaufene Einladungslinks (noch kein Invitations-Table,
--      vorbereitet für spätere Implementierung)
--   2. Verwaiste Chat-Threads (keine Teilnehmer mehr)
--   3. Leere Warenkörbe (ältere Einträge bereinigen)
--
-- Aufruf manuell oder via Supabase Edge Function (Cron):
--   SELECT run_dsgvo_cleanup();
-- ============================================================

-- ============================================================
-- 1. INVITATIONS TABLE (vorbereitet für Einladungslinks)
-- ============================================================
-- Noch nicht aktiv genutzt — wird beim Einladungs-Feature befüllt.
-- Struktur hier definiert damit Cleanup-Routine schon greift.

CREATE TABLE IF NOT EXISTS invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theater_id   UUID REFERENCES theaters(id) ON DELETE CASCADE NOT NULL,
  invited_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email        TEXT,
  role         TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  -- Token wird via gen_random_uuid() erzeugt (keine pgcrypto-Abhängigkeit)
  token        TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  used_at      TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invitations_token     ON invitations(token);
CREATE INDEX idx_invitations_theater   ON invitations(theater_id);
CREATE INDEX idx_invitations_expires   ON invitations(expires_at);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Theater owner/admin can manage invitations"
  ON invitations FOR ALL
  USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM theater_members tm
      WHERE tm.theater_id = invitations.theater_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

COMMENT ON TABLE invitations IS
  'Einladungslinks für neue Theater-Mitglieder. '
  'Ablauf: 7 Tage. Einmalig verwendbar (used_at wird gesetzt). '
  'Abgelaufene Einträge werden via run_dsgvo_cleanup() bereinigt.';

-- ============================================================
-- 2. HAUPT-CLEANUP-FUNKTION
-- ============================================================

CREATE OR REPLACE FUNCTION run_dsgvo_cleanup()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{}';
  v_count  INTEGER;
BEGIN
  -- Nur Platform Admin oder intern (SECURITY DEFINER Kontext)
  IF auth.uid() IS NOT NULL AND NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Nur Platform Admins dürfen Cleanup ausführen.';
  END IF;

  -- 1. Abgelaufene Einladungslinks löschen (älter als 7 Tage, unbenutzt)
  DELETE FROM invitations
  WHERE expires_at < now()
    AND used_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('expired_invitations_deleted', v_count);

  -- 2. Benutzte Einladungslinks nach 30 Tagen löschen
  DELETE FROM invitations
  WHERE used_at IS NOT NULL
    AND used_at < now() - interval '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('used_invitations_deleted', v_count);

  -- 3. Verwaiste Chat-Threads löschen (keine Teilnehmer mehr)
  DELETE FROM chat_threads
  WHERE NOT EXISTS (
    SELECT 1 FROM chat_thread_participants ctp
    WHERE ctp.thread_id = chat_threads.id
  )
  AND created_at < now() - interval '24 hours';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('orphaned_threads_deleted', v_count);

  -- 4. Alte Warenkorb-Einträge bereinigen (> 90 Tage)
  DELETE FROM cart_items
  WHERE added_at < now() - interval '90 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('old_cart_items_deleted', v_count);

  -- Audit-Eintrag
  PERFORM write_audit_log(
    'dsgvo_cleanup_run',
    'system',
    NULL,
    NULL,
    v_result
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION run_dsgvo_cleanup() IS
  'DSGVO-Datenbereinigung: Löscht abgelaufene Einladungslinks, '
  'verwaiste Chat-Threads und alte Warenkorb-Einträge. '
  'Empfohlen: wöchentlich via Cron ausführen.';
