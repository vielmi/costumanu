-- ============================================================
-- MIGRATION: DSGVO — Profile-Sichtbarkeit einschränken
-- ============================================================
-- Problem: "Authenticated users can view profiles" erlaubt
-- ANY authenticated user (inkl. Viewer fremder Theater) alle
-- Profile inklusive Telefonnummer zu sehen.
-- Fix: Profile nur für Co-Members (gleiche Theater) sichtbar.
-- ============================================================

-- Bestehende zu breite Policy entfernen
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Ersatz: nur eigenes Profil + Co-Members im gleichen Theater
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Members can view co-member profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM theater_members tm1
      JOIN theater_members tm2 ON tm1.theater_id = tm2.theater_id
      WHERE tm1.user_id = auth.uid()
        AND tm2.user_id = profiles.id
    )
    OR is_platform_admin()
  );

-- Chat-Kontext: Teilnehmer eines gemeinsamen Threads dürfen sich gegenseitig sehen
-- (z.B. Theater A und Theater B bei einer Ausleihe-Anfrage)
CREATE POLICY "Chat participants can view each other profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_thread_participants ctp1
      JOIN chat_thread_participants ctp2 ON ctp1.thread_id = ctp2.thread_id
      WHERE ctp1.user_id = auth.uid()
        AND ctp2.user_id = profiles.id
    )
  );

-- Netzwerk-Kontext: nur display_name + professional_title sichtbar
-- (kein Telefon, kein Avatar-URL für fremde Netzwerk-Theater)
-- Umgesetzt via Security-Definer View für Netzwerk-Queries
CREATE OR REPLACE VIEW public_profile_for_network AS
  SELECT
    id,
    display_name,
    professional_title
    -- phone und avatar_url bewusst weggelassen
  FROM profiles;

-- Nur authenticated darf die View lesen
REVOKE ALL ON public_profile_for_network FROM anon;
GRANT SELECT ON public_profile_for_network TO authenticated;
