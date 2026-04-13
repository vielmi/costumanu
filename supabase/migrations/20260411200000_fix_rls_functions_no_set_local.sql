-- ============================================================
-- MIGRATION: Fix — RLS-Funktionen ohne SET LOCAL row_security
-- ============================================================
-- Problem: get_my_theater_ids() und is_member_of() verwenden
-- SET LOCAL row_security = off. In Supabase Cloud ist dieser
-- Parameter für die postgres-Rolle eingeschränkt → Fehler bei
-- der Policy-Auswertung → theater_members-Query gibt keine
-- Zeilen zurück, obwohl die Mitgliedschaft existiert.
--
-- Fix: SET LOCAL row_security = off entfernen.
-- SECURITY DEFINER-Funktionen, die dem postgres-Superuser
-- gehören, umgehen RLS automatisch — SET LOCAL ist redundant.
-- PL/pgSQL verhindert das Inlining durch den Planner und
-- damit die ursprüngliche Rekursion.
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_theater_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
    SELECT theater_id FROM theater_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_member_of(check_theater_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM theater_members
    WHERE theater_id = check_theater_id
      AND user_id = auth.uid()
  ) INTO v_result;
  RETURN v_result OR is_platform_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
