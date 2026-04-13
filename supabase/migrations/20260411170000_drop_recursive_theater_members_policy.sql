-- ============================================================
-- MIGRATION: Fix — Rekursive Policy auf theater_members entfernen
-- ============================================================
-- Root Cause: "Members can view co-members" ruft is_member_of()
-- auf, welche theater_members liest → 42P17 infinite recursion.
-- PostgreSQL evaluiert ALLE SELECT-Policies (OR-verknüpft),
-- daher reicht die neue direkte Policy allein nicht.
--
-- Lösung:
-- 1. Rekursive Policy droppen
-- 2. Direkte Self-Lookup-Policy behalten (aus Migration 150000)
-- 3. Co-Member-Sichtbarkeit via nicht-rekursive Funktion neu
--    aufbauen (is_member_of bleibt für ANDERE Tabellen korrekt)
-- ============================================================

-- ============================================================
-- 1. Rekursive Policy entfernen
-- ============================================================

DROP POLICY IF EXISTS "Members can view co-members" ON theater_members;

-- ============================================================
-- 2. Nicht-rekursive Co-Member Policy
-- ============================================================
-- Liest theater_members in einer SECURITY DEFINER Funktion
-- mit deaktiviertem row_security — kein Rekursionsrisiko.

CREATE OR REPLACE FUNCTION get_my_theater_ids()
RETURNS SETOF UUID AS $$
BEGIN
  SET LOCAL row_security = off;
  RETURN QUERY
    SELECT theater_id FROM theater_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Members can view co-members"
  ON theater_members FOR SELECT
  USING (
    theater_id IN (SELECT get_my_theater_ids())
    OR is_platform_admin()
  );

-- ============================================================
-- 3. is_member_of: ebenfalls auf PL/pgSQL umstellen
-- ============================================================
-- Verhindert, dass andere Tabellen-Policies ebenfalls rekursiv
-- werden, falls PostgreSQL die SQL-Funktion inline expandiert.

CREATE OR REPLACE FUNCTION is_member_of(check_theater_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  SET LOCAL row_security = off;
  SELECT EXISTS (
    SELECT 1 FROM theater_members
    WHERE theater_id = check_theater_id
      AND user_id = auth.uid()
  ) INTO v_result;
  RETURN v_result OR is_platform_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
