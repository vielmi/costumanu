-- ============================================================
-- MIGRATION: Fix — Infinite Recursion in is_member_of
-- ============================================================
-- Problem: is_member_of() (SQL SECURITY DEFINER STABLE) liest
-- theater_members. PostgreSQL erkennt dies als Rekursion, weil
-- der Aufruf aus einer theater_members-RLS-Policy kommt.
-- STABLE SQL-Funktionen können vom Planner inline-expandiert
-- werden → RLS-Rekursionsschutz greift auch bei SECURITY DEFINER.
--
-- Fix: Umschreiben auf PL/pgSQL mit SET LOCAL row_security = off.
-- PL/pgSQL-Funktionen werden nie inline-expandiert. Das
-- SET LOCAL deaktiviert RLS für diese Session-Transaktion, so
-- dass der theater_members-Lookup ohne Rekursion möglich ist.
-- Voraussetzung: Funktions-Owner (postgres) ist Superuser → ok.
-- ============================================================

-- ============================================================
-- 1. is_member_of: SQL → PL/pgSQL, row_security deaktivieren
-- ============================================================

CREATE OR REPLACE FUNCTION is_member_of(check_theater_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  -- Deaktiviere RLS für diesen Lookup, um Rekursion zu verhindern.
  -- Erlaubt weil Funktions-Owner (postgres) Superuser ist.
  SET LOCAL row_security = off;

  SELECT EXISTS (
    SELECT 1 FROM theater_members
    WHERE theater_id = check_theater_id
      AND user_id = auth.uid()
  ) INTO v_result;

  RETURN v_result OR is_platform_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. theater_members: Policies bereinigen
-- ============================================================
-- "Users can view their own membership" (aus 20260411150000) ist
-- als Fallback bereits vorhanden. Die "Members can view co-members"
-- Policy kann jetzt wieder sicher auf is_member_of() verweisen,
-- weil die Funktion keine Rekursion mehr auslöst.

-- Keine Änderung nötig — Policies bleiben wie sie sind.
-- is_member_of() wird jetzt korrekt ohne Rekursion ausgeführt.
