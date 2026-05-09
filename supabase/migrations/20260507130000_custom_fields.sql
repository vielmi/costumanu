-- ============================================================
-- MIGRATION: Custom Fields (BC §5c — Schema-on-Read)
-- ============================================================
-- Theater können eigene Kostüm-Felder definieren (field_definitions).
-- Netzwerke können Felder vorschreiben (field_requirements).
-- Kostüm-Werte werden in costumes.custom_fields JSONB gespeichert.
-- Schlüssel = field_definitions.label, Wert = Eingabe des Users.
-- ============================================================

-- ─── 1. Feld-Definitionen (pro Theater) ──────────────────────────────────────

CREATE TABLE field_definitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theater_id  UUID REFERENCES theaters(id) ON DELETE CASCADE NOT NULL,
  label       TEXT NOT NULL,
  field_type  TEXT NOT NULL DEFAULT 'text'
              CHECK (field_type IN ('text', 'textarea', 'number', 'boolean', 'select')),
  options     JSONB DEFAULT NULL,    -- nur für field_type = 'select': ["Option A", "Option B"]
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(theater_id, label)
);

CREATE INDEX idx_field_definitions_theater ON field_definitions(theater_id);

-- ─── 2. Feld-Anforderungen (pro Netzwerk) ────────────────────────────────────
-- Ein Netzwerk kann Mitglied-Theatern vorschreiben, welche Felder sie pflegen müssen.

CREATE TABLE field_requirements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id  UUID REFERENCES theater_networks(id) ON DELETE CASCADE NOT NULL,
  label       TEXT NOT NULL,
  field_type  TEXT NOT NULL DEFAULT 'text'
              CHECK (field_type IN ('text', 'textarea', 'number', 'boolean', 'select')),
  options     JSONB DEFAULT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(network_id, label)
);

CREATE INDEX idx_field_requirements_network ON field_requirements(network_id);

-- ─── 3. custom_fields JSONB auf costumes ─────────────────────────────────────

ALTER TABLE costumes
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

COMMENT ON COLUMN costumes.custom_fields IS
  'Theater-spezifische Kostüm-Attribute. Schlüssel = field_definitions.label. '
  'Wert immer als TEXT gespeichert — Konvertierung erfolgt im App-Code.';

-- ─── 4. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE field_definitions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_requirements ENABLE ROW LEVEL SECURITY;

-- Theater-Owner/Admin darf eigene Felddefinitionen verwalten
CREATE POLICY "Owner/admin can manage field definitions"
  ON field_definitions FOR ALL
  USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM theater_members tm
      WHERE tm.theater_id = field_definitions.theater_id
        AND tm.user_id    = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- Alle Theater-Mitglieder dürfen die Definitionen lesen (um das Formular zu rendern)
CREATE POLICY "Members can read field definitions"
  ON field_definitions FOR SELECT
  USING (is_member_of(theater_id));

-- Netzwerk-Mitglieder dürfen Anforderungen lesen
CREATE POLICY "Network members can read field requirements"
  ON field_requirements FOR SELECT
  USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM theater_network_members tnm
      WHERE tnm.network_id = field_requirements.network_id
        AND is_member_of(tnm.theater_id)
    )
  );

-- Nur Platform Admin verwaltet Netzwerk-Anforderungen
CREATE POLICY "Platform admin can manage field requirements"
  ON field_requirements FOR ALL
  USING (is_platform_admin());
