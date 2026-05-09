-- ============================================================
-- MIGRATION: Netzwerk-Admin Rolle (BC §11)
-- ============================================================
-- Theater-User mit Rolle owner/admin in einem Theater können
-- zusätzlich als "Netzwerk-Admin" für ein bestimmtes Netzwerk
-- ernannt werden. Netzwerk-Admins verwalten die Einstellungen
-- ihres Netzwerks (Default-Sichtbarkeit, Beschreibung) ohne
-- volle Platform-Admin-Rechte zu benötigen.
-- ============================================================

-- ─── 1. network_role auf theater_network_members ──────────────────────────────

ALTER TABLE theater_network_members
  ADD COLUMN IF NOT EXISTS network_role TEXT NOT NULL DEFAULT 'member'
  CHECK (network_role IN ('member', 'admin'));

COMMENT ON COLUMN theater_network_members.network_role IS
  'Rolle des Theaters im Netzwerk: ''member'' (Standard) oder ''admin'' '
  '(kann Netzwerk-Einstellungen bearbeiten). Setzt theater_members.role '
  'IN (''owner'', ''admin'') voraus — wird im App-Code geprüft.';

-- ─── 2. Helper-Funktion: is_network_admin() ──────────────────────────────────
-- Gibt true zurück wenn der aktuelle User in mindestens einem Theater
-- owner/admin ist, das im angegebenen Netzwerk network_role = 'admin' hat.

CREATE OR REPLACE FUNCTION is_network_admin(p_network_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM theater_network_members tnm
    JOIN theater_members tm
      ON tm.theater_id = tnm.theater_id
    WHERE tnm.network_id   = p_network_id
      AND tnm.network_role = 'admin'
      AND tm.user_id       = auth.uid()
      AND tm.role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── 3. Aktualisierte Netzwerk-Policies ──────────────────────────────────────

-- Netzwerk-Admins dürfen die Einstellungen ihres Netzwerks bearbeiten
-- (name, description, default_visibility) — aber keine Mitglieder verwalten.
DROP POLICY IF EXISTS "Platform admin can manage networks" ON theater_networks;

CREATE POLICY "Platform admin can manage all networks"
  ON theater_networks FOR ALL
  USING (is_platform_admin());

CREATE POLICY "Network admin can update their network settings"
  ON theater_networks FOR UPDATE
  USING (is_network_admin(id))
  WITH CHECK (is_network_admin(id));

-- Netzwerk-Mitgliedschaft (theater_network_members) bleibt Platform-Admin-only
-- Einschränkungen (theater_network_restrictions) können Netzwerk-Admins setzen
DROP POLICY IF EXISTS "Theater owner/admin can manage restrictions" ON theater_network_restrictions;

CREATE POLICY "Platform admin or network admin can manage restrictions"
  ON theater_network_restrictions FOR ALL
  USING (
    is_platform_admin()
    OR is_network_admin(network_id)
  );
