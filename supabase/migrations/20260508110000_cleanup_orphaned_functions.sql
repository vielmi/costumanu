-- ============================================================
-- MIGRATION: Cleanup — verwaiste Hilfsfunktionen entfernen
-- ============================================================
-- get_my_theater_ids() wurde in 20260411170000 für die Policy
-- "Members can view co-members" erstellt. Diese Policy wurde
-- in 20260411210000 gedroppt (RLS-Rekursion unlösbar ohne
-- Supabase Service Role). Die Funktion ist seither ungenutzt.
-- ============================================================

DROP FUNCTION IF EXISTS get_my_theater_ids();
