-- ============================================================
-- MIGRATION: Netzwerk, Kollektionen, Platform Admin
-- ============================================================
-- Ergänzt das bestehende Schema um:
--   1. Platform Admin Rolle
--   2. Theater-Netzwerke (n:m)
--   3. Kollektionen / Fundi (physische Locations)
--   4. Netzwerk-Sichtbarkeit pro Kostüm
--   5. Netzwerk-Einschränkungen zwischen Theatern
-- Bestehende Tabellen und Policies bleiben unverändert.
-- ============================================================

-- ============================================================
-- 1. PLATFORM ADMIN
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

-- Helper: schnelle Abfrage ob der aktuelle User Platform Admin ist
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_platform_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Platform Admin darf alle Theater sehen (ergänzt bestehende Policy)
CREATE POLICY "Platform admin can view all theaters"
  ON theaters FOR SELECT
  USING (is_platform_admin());

CREATE POLICY "Platform admin can manage all theaters"
  ON theaters FOR ALL
  USING (is_platform_admin());

CREATE POLICY "Platform admin can view all costumes"
  ON costumes FOR SELECT
  USING (is_platform_admin());

CREATE POLICY "Platform admin can view all profiles"
  ON profiles FOR SELECT
  USING (is_platform_admin());

CREATE POLICY "Platform admin can view all members"
  ON theater_members FOR SELECT
  USING (is_platform_admin());

-- ============================================================
-- 2. THEATER-NETZWERKE
-- ============================================================

CREATE TABLE theater_networks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  -- Default-Sichtbarkeit beim Netzwerkbeitritt:
  -- 'none'    = Kostüme standardmässig nicht sichtbar (muss explizit freigegeben werden)
  -- 'all'     = alle Kostüme sofort sichtbar (kann eingeschränkt werden)
  default_visibility TEXT NOT NULL DEFAULT 'none'
    CHECK (default_visibility IN ('none', 'all')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Welche Theater gehören welchem Netzwerk (n:m)
-- Ein Theater kann mehreren Netzwerken angehören
CREATE TABLE theater_network_members (
  network_id  UUID REFERENCES theater_networks(id) ON DELETE CASCADE NOT NULL,
  theater_id  UUID REFERENCES theaters(id) ON DELETE CASCADE NOT NULL,
  joined_at   TIMESTAMPTZ DEFAULT now(),
  -- Wer hat das Theater hinzugefügt (immer ein Platform Admin)
  added_by    UUID REFERENCES auth.users(id),
  PRIMARY KEY (network_id, theater_id)
);

-- Einschränkungen: Theater A blockiert Theater B innerhalb eines Netzwerks
-- → Theater B sieht keine Kostüme von Theater A, auch wenn diese freigegeben sind
CREATE TABLE theater_network_restrictions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id        UUID REFERENCES theater_networks(id) ON DELETE CASCADE NOT NULL,
  lender_theater_id UUID REFERENCES theaters(id) ON DELETE CASCADE NOT NULL,  -- blockiert
  viewer_theater_id UUID REFERENCES theaters(id) ON DELETE CASCADE NOT NULL,  -- darf nicht sehen
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (network_id, lender_theater_id, viewer_theater_id)
);

-- Indexes
CREATE INDEX idx_network_members_theater  ON theater_network_members(theater_id);
CREATE INDEX idx_network_members_network  ON theater_network_members(network_id);
CREATE INDEX idx_network_restrictions_lender ON theater_network_restrictions(lender_theater_id);

-- RLS
ALTER TABLE theater_networks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE theater_network_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE theater_network_restrictions ENABLE ROW LEVEL SECURITY;

-- Netzwerke: sichtbar für alle Mitglieder eines Mitglied-Theaters
CREATE POLICY "Network members can view their networks"
  ON theater_networks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM theater_network_members tnm
      WHERE tnm.network_id = id AND is_member_of(tnm.theater_id)
    )
  );

CREATE POLICY "Platform admin can manage networks"
  ON theater_networks FOR ALL
  USING (is_platform_admin());

-- Network members: sichtbar für Mitglieder des eigenen Theaters
CREATE POLICY "Theater members can view network membership"
  ON theater_network_members FOR SELECT
  USING (is_member_of(theater_id) OR is_platform_admin());

CREATE POLICY "Platform admin can manage network membership"
  ON theater_network_members FOR ALL
  USING (is_platform_admin());

-- Restrictions: nur Platform Admin und Theater-Owner verwalten
CREATE POLICY "Theater members can view restrictions"
  ON theater_network_restrictions FOR SELECT
  USING (
    is_member_of(lender_theater_id)
    OR is_member_of(viewer_theater_id)
    OR is_platform_admin()
  );

CREATE POLICY "Theater owner/admin can manage restrictions"
  ON theater_network_restrictions FOR ALL
  USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM theater_members tm
      WHERE tm.theater_id = lender_theater_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 3. KOLLEKTIONEN / FUNDI (physische Locations)
-- ============================================================

CREATE TABLE collections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theater_id   UUID REFERENCES theaters(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  -- Typ für spätere Erweiterung (Requisite, Perücken, etc.)
  type         TEXT NOT NULL DEFAULT 'costume'
    CHECK (type IN ('costume')),  -- wird später erweitert
  address_info JSONB,   -- { "street": "...", "city": "...", "zip": "..." }
  is_active    BOOLEAN NOT NULL DEFAULT true,
  settings     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_collections_theater ON collections(theater_id);

-- Für jedes bestehende Theater einen Standard-Fundus anlegen
INSERT INTO collections (theater_id, name, type)
SELECT id, 'Hauptfundus', 'costume'
FROM theaters
ON CONFLICT DO NOTHING;

-- Kostüme: collection_id hinzufügen (nullable, für Rückwärtskompatibilität)
ALTER TABLE costumes
  ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

-- Bestehende Kostüme dem Standard-Fundus ihres Theaters zuweisen
UPDATE costumes c
SET collection_id = col.id
FROM collections col
WHERE col.theater_id = c.theater_id
  AND col.name = 'Hauptfundus'
  AND c.collection_id IS NULL;

CREATE INDEX idx_costumes_collection ON costumes(collection_id);

-- RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their collections"
  ON collections FOR SELECT
  USING (is_member_of(theater_id) OR is_platform_admin());

CREATE POLICY "Owner/admin can manage collections"
  ON collections FOR ALL
  USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM theater_members tm
      WHERE tm.theater_id = collections.theater_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 4. NETZWERK-SICHTBARKEIT PRO KOSTÜM
-- ============================================================
-- Default: nicht sichtbar (muss explizit freigegeben werden)
-- Ein Eintrag hier = Kostüm ist für dieses Netzwerk freigegeben
-- Zusätzlich kann theater_network_restrictions einzelne Theater blocken

CREATE TABLE costume_network_visibility (
  costume_id  UUID REFERENCES costumes(id) ON DELETE CASCADE NOT NULL,
  network_id  UUID REFERENCES theater_networks(id) ON DELETE CASCADE NOT NULL,
  is_visible  BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (costume_id, network_id)
);

CREATE INDEX idx_costume_network_vis_network ON costume_network_visibility(network_id);
CREATE INDEX idx_costume_network_vis_costume ON costume_network_visibility(costume_id);

ALTER TABLE costume_network_visibility ENABLE ROW LEVEL SECURITY;

-- Sichtbar für Mitglieder des Theaters, dem das Kostüm gehört
-- UND für Mitglieder von Theatern im selben Netzwerk (Lesezugriff)
CREATE POLICY "Theater members can manage their costume visibility"
  ON costume_network_visibility FOR ALL
  USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM costumes c
      WHERE c.id = costume_id AND is_member_of(c.theater_id)
    )
  );

CREATE POLICY "Network members can read visibility settings"
  ON costume_network_visibility FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM theater_network_members tnm
      WHERE tnm.network_id = costume_network_visibility.network_id
        AND is_member_of(tnm.theater_id)
    )
    OR is_platform_admin()
  );

-- ============================================================
-- 5. HELPER FUNCTION: Netzwerk-Sichtbarkeit prüfen
-- ============================================================
-- Gibt true zurück wenn costume_id für viewer_theater_id
-- in mindestens einem gemeinsamen Netzwerk sichtbar ist
-- und keine Einschränkung greift.

CREATE OR REPLACE FUNCTION costume_visible_to_theater(
  p_costume_id     UUID,
  p_viewer_theater UUID
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM costume_network_visibility cnv
    JOIN theater_network_members lender_nm
      ON lender_nm.network_id = cnv.network_id
    JOIN theater_network_members viewer_nm
      ON viewer_nm.network_id = cnv.network_id
    JOIN costumes c ON c.id = cnv.costume_id
    WHERE cnv.costume_id  = p_costume_id
      AND cnv.is_visible  = true
      AND viewer_nm.theater_id = p_viewer_theater
      AND lender_nm.theater_id = c.theater_id
      -- Keine aktive Einschränkung zwischen den Theatern
      AND NOT EXISTS (
        SELECT 1 FROM theater_network_restrictions tnr
        WHERE tnr.network_id        = cnv.network_id
          AND tnr.lender_theater_id = c.theater_id
          AND tnr.viewer_theater_id = p_viewer_theater
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 6. AKTUALISIERTE is_member_of FUNCTION
-- ============================================================
-- Platform Admin gilt überall als Mitglied (für App-Logik)

CREATE OR REPLACE FUNCTION is_member_of(check_theater_id UUID)
RETURNS BOOLEAN AS $$
  SELECT (
    -- Direktes Mitglied
    EXISTS (
      SELECT 1 FROM theater_members
      WHERE theater_id = check_theater_id AND user_id = auth.uid()
    )
    -- ODER Platform Admin
    OR is_platform_admin()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
