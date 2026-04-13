-- ============================================================
-- MIGRATION: Platform Admin Audit-Log
-- ============================================================
-- Protokolliert alle sicherheitsrelevanten Aktionen von
-- Platform Admins (und Owner/Admin-Rollenänderungen).
-- ============================================================

CREATE TABLE platform_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  -- Betroffenes Objekt (Theater, Network, User, etc.)
  target_type  TEXT NOT NULL,
  target_id    UUID,
  -- Vorher/Nachher als JSONB für flexible Dokumentation
  old_data     JSONB,
  new_data     JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_log_performed_by ON platform_audit_log(performed_by);
CREATE INDEX idx_audit_log_created_at   ON platform_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_target       ON platform_audit_log(target_type, target_id);

-- RLS: Nur Platform Admins dürfen den Log lesen
ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only platform admins can read audit log"
  ON platform_audit_log FOR SELECT
  USING (is_platform_admin());

-- Niemand darf Einträge direkt schreiben (nur via SECURITY DEFINER Funktionen)
CREATE POLICY "No direct insert"
  ON platform_audit_log FOR INSERT
  WITH CHECK (false);

-- ============================================================
-- Helper-Funktion: Audit-Eintrag schreiben
-- ============================================================
CREATE OR REPLACE FUNCTION write_audit_log(
  p_action      TEXT,
  p_target_type TEXT,
  p_target_id   UUID DEFAULT NULL,
  p_old_data    JSONB DEFAULT NULL,
  p_new_data    JSONB DEFAULT NULL
)
RETURNS VOID AS $$
  INSERT INTO platform_audit_log (performed_by, action, target_type, target_id, old_data, new_data)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_old_data, p_new_data);
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- Trigger: Theater-Netzwerk-Mitgliedschaft (Platform Admin Aktion)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_audit_network_membership()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM write_audit_log(
      'network_member_added',
      'theater_network_members',
      NEW.theater_id,
      NULL,
      jsonb_build_object('network_id', NEW.network_id, 'theater_id', NEW.theater_id)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM write_audit_log(
      'network_member_removed',
      'theater_network_members',
      OLD.theater_id,
      jsonb_build_object('network_id', OLD.network_id, 'theater_id', OLD.theater_id),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_network_membership
  AFTER INSERT OR DELETE ON theater_network_members
  FOR EACH ROW EXECUTE FUNCTION trg_audit_network_membership();

-- ============================================================
-- Trigger: Platform Admin Rolle setzen/entfernen
-- ============================================================
CREATE OR REPLACE FUNCTION trg_audit_platform_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_platform_admin IS DISTINCT FROM NEW.is_platform_admin THEN
    PERFORM write_audit_log(
      CASE WHEN NEW.is_platform_admin THEN 'platform_admin_granted' ELSE 'platform_admin_revoked' END,
      'profiles',
      NEW.id,
      jsonb_build_object('is_platform_admin', OLD.is_platform_admin),
      jsonb_build_object('is_platform_admin', NEW.is_platform_admin)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_platform_admin
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trg_audit_platform_admin();

-- ============================================================
-- Trigger: Theater-Rollen-Änderungen (owner/admin vergeben)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_audit_theater_role()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IN ('owner', 'admin') THEN
      PERFORM write_audit_log(
        'theater_role_assigned',
        'theater_members',
        NEW.user_id,
        NULL,
        jsonb_build_object('theater_id', NEW.theater_id, 'role', NEW.role, 'user_id', NEW.user_id)
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      PERFORM write_audit_log(
        'theater_role_changed',
        'theater_members',
        NEW.user_id,
        jsonb_build_object('theater_id', OLD.theater_id, 'role', OLD.role),
        jsonb_build_object('theater_id', NEW.theater_id, 'role', NEW.role)
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM write_audit_log(
      'theater_member_removed',
      'theater_members',
      OLD.user_id,
      jsonb_build_object('theater_id', OLD.theater_id, 'role', OLD.role),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_theater_role
  AFTER INSERT OR UPDATE OR DELETE ON theater_members
  FOR EACH ROW EXECUTE FUNCTION trg_audit_theater_role();
