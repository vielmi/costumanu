-- ============================================================
-- MIGRATION: Fix — Security Definer View public_profile_for_network
-- ============================================================
-- Problem: Der View wurde ohne security_invoker = true erstellt.
-- PostgreSQL führt den View mit den Rechten des Erstellers aus
-- (postgres/Superuser), wodurch RLS-Policies auf profiles
-- umgangen werden. Supabase Security Advisor meldet dies als Error.
--
-- Fix: View mit security_invoker = true neu erstellen.
-- Damit werden die RLS-Policies des abfragenden Users respektiert.
-- ============================================================

DROP VIEW IF EXISTS public_profile_for_network;

CREATE VIEW public_profile_for_network
WITH (security_invoker = true) AS
  SELECT
    id,
    display_name,
    professional_title
    -- phone und avatar_url bewusst weggelassen
  FROM profiles;

REVOKE ALL ON public_profile_for_network FROM anon;
GRANT SELECT ON public_profile_for_network TO authenticated;
