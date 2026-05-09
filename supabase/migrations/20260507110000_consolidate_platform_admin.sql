-- ============================================================
-- MIGRATION: Platform Admin konsolidieren
-- ============================================================
-- Problem: profiles hat zwei parallele Spalten für Platform Admin:
--   • platform_role TEXT  (Migration 20260406) — genutzt von App-Code (TypeScript)
--   • is_platform_admin BOOLEAN (Migration 20260410) — genutzt von is_platform_admin() SQL-Funktion
--
-- Da is_platform_admin BOOLEAN nie gesetzt wurde (DEFAULT false), sind alle
-- RLS-Policies die is_platform_admin() aufrufen für den Platform Admin defacto broken.
--
-- Fix: is_platform_admin() liest neu platform_role. BOOLEAN-Spalte wird entfernt.
-- ============================================================

-- 1. is_platform_admin() auf platform_role umstellen (Source of Truth = App-Code)
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT platform_role = 'platform_admin' FROM profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Audit-Trigger auf platform_role umstellen (war is_platform_admin BOOLEAN)
CREATE OR REPLACE FUNCTION trg_audit_platform_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.platform_role IS DISTINCT FROM NEW.platform_role THEN
    PERFORM write_audit_log(
      CASE WHEN NEW.platform_role = 'platform_admin' THEN 'platform_admin_granted' ELSE 'platform_admin_revoked' END,
      'profiles',
      NEW.id,
      jsonb_build_object('platform_role', OLD.platform_role),
      jsonb_build_object('platform_role', NEW.platform_role)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Redundante BOOLEAN-Spalte entfernen
ALTER TABLE profiles DROP COLUMN IF EXISTS is_platform_admin;
