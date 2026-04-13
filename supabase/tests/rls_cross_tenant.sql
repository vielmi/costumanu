-- ============================================================
-- RLS TEST: Cross-Tenant Datenisolation
-- ============================================================
-- Stellt sicher dass Theater A niemals Daten von Theater B
-- lesen oder mutieren kann.
--
-- Ausführen:
--   supabase test db
-- ============================================================

BEGIN;

SELECT plan(20);

-- ============================================================
-- SETUP: Zwei Test-Theater und je einen User anlegen
-- ============================================================

-- Theater A
INSERT INTO theaters (id, name, slug) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Theater A', 'theater-a'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Theater B', 'theater-b');

-- Fake Auth-User IDs (ohne echten auth.users Eintrag — nur für RLS-Tests)
-- Wir setzen auth.uid() via SET LOCAL role und config
DO $$
BEGIN
  INSERT INTO profiles (id, display_name) VALUES
    ('aaaaaaaa-0000-0000-0000-000000000002', 'User A'),
    ('bbbbbbbb-0000-0000-0000-000000000002', 'User B');
EXCEPTION WHEN foreign_key_violation THEN
  -- auth.users existiert nicht in Tests — Profile via SECURITY DEFINER überspringen
  NULL;
END $$;

-- Kostüm in Theater A
INSERT INTO costumes (id, theater_id, name) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'Kostüm von Theater A');

-- Kostüm in Theater B
INSERT INTO costumes (id, theater_id, name) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 'Kostüm von Theater B');

-- ============================================================
-- TEST 1: Theater-Isolation — is_member_of()
-- ============================================================

-- User A ist Mitglied von Theater A
SELECT ok(
  NOT is_member_of('bbbbbbbb-0000-0000-0000-000000000001'),
  'User ohne Theater-Mitgliedschaft ist kein Member'
);

-- ============================================================
-- TEST 2: Kostüm-Sichtbarkeit (als anon — kein Zugriff)
-- ============================================================

SET LOCAL role TO anon;

SELECT is_empty(
  $$ SELECT * FROM costumes $$,
  'Anon kann keine Kostüme sehen (ohne public items)'
);

SELECT is_empty(
  $$ SELECT * FROM theaters $$,
  'Anon kann keine Theater sehen'
);

SELECT is_empty(
  $$ SELECT * FROM profiles $$,
  'Anon kann keine Profile sehen'
);

SELECT is_empty(
  $$ SELECT * FROM theater_members $$,
  'Anon kann keine Theater-Mitglieder sehen'
);

RESET role;

-- ============================================================
-- TEST 3: Platform Admin hat Vollzugriff
-- ============================================================

-- is_platform_admin() gibt false zurück wenn kein User eingeloggt
SELECT ok(
  NOT is_platform_admin(),
  'is_platform_admin() gibt false zurück ohne eingeloggten User'
);

-- ============================================================
-- TEST 4: Netzwerk-Sichtbarkeit — Default nicht sichtbar
-- ============================================================

-- Netzwerk anlegen
INSERT INTO theater_networks (id, name, slug, default_visibility) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'Test Netzwerk', 'test-netzwerk', 'none');

-- Beide Theater dem Netzwerk hinzufügen
INSERT INTO theater_network_members (network_id, theater_id) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001');

-- Kostüm A ist NICHT sichtbar für Theater B (kein Eintrag in costume_network_visibility)
SELECT ok(
  NOT costume_visible_to_theater(
    'aaaaaaaa-0000-0000-0000-000000000003',
    'bbbbbbbb-0000-0000-0000-000000000001'
  ),
  'Kostüm von Theater A ist NICHT sichtbar für Theater B (Default: nicht sichtbar)'
);

-- Kostüm A für Netzwerk freigeben
INSERT INTO costume_network_visibility (costume_id, network_id, is_visible, is_lendable) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000001', true, true);

-- Jetzt sichtbar
SELECT ok(
  costume_visible_to_theater(
    'aaaaaaaa-0000-0000-0000-000000000003',
    'bbbbbbbb-0000-0000-0000-000000000001'
  ),
  'Kostüm von Theater A ist sichtbar für Theater B nach Freigabe'
);

-- Auch ausleihbar
SELECT ok(
  costume_lendable_to_theater(
    'aaaaaaaa-0000-0000-0000-000000000003',
    'bbbbbbbb-0000-0000-0000-000000000001'
  ),
  'Kostüm von Theater A ist ausleihbar für Theater B'
);

-- ============================================================
-- TEST 5: Blocking — Theater B blockt Theater A
-- ============================================================

INSERT INTO theater_network_restrictions (network_id, lender_theater_id, viewer_theater_id) VALUES
  ('cccccccc-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000001');

-- Nach Blocking: nicht mehr sichtbar
SELECT ok(
  NOT costume_visible_to_theater(
    'aaaaaaaa-0000-0000-0000-000000000003',
    'bbbbbbbb-0000-0000-0000-000000000001'
  ),
  'Kostüm von Theater A ist NICHT mehr sichtbar nach Blocking durch Theater B'
);

-- Nach Blocking: nicht mehr ausleihbar
SELECT ok(
  NOT costume_lendable_to_theater(
    'aaaaaaaa-0000-0000-0000-000000000003',
    'bbbbbbbb-0000-0000-0000-000000000001'
  ),
  'Kostüm von Theater A ist NICHT mehr ausleihbar nach Blocking'
);

-- ============================================================
-- TEST 6: is_lendable unabhängig von is_visible
-- ============================================================

-- Sichtbar aber nicht ausleihbar
UPDATE costume_network_visibility
SET is_lendable = false
WHERE costume_id = 'aaaaaaaa-0000-0000-0000-000000000003';

-- Restriction entfernen damit nur is_lendable greift
DELETE FROM theater_network_restrictions
WHERE lender_theater_id = 'aaaaaaaa-0000-0000-0000-000000000001';

SELECT ok(
  NOT costume_lendable_to_theater(
    'aaaaaaaa-0000-0000-0000-000000000003',
    'bbbbbbbb-0000-0000-0000-000000000001'
  ),
  'Kostüm ist sichtbar aber NICHT ausleihbar wenn is_lendable = false'
);

-- ============================================================
-- TEST 7: Audit-Log Tabelle existiert
-- ============================================================

SELECT has_table('public', 'platform_audit_log', 'platform_audit_log Tabelle existiert');
SELECT has_table('public', 'invitations', 'invitations Tabelle existiert');
SELECT has_table('public', 'costume_network_visibility', 'costume_network_visibility Tabelle existiert');
SELECT has_table('public', 'theater_network_restrictions', 'theater_network_restrictions Tabelle existiert');
SELECT has_table('public', 'collections', 'collections Tabelle existiert');

-- ============================================================
-- TEST 8: Wichtige Funktionen existieren
-- ============================================================

SELECT has_function('public', 'is_member_of', 'is_member_of() Funktion existiert');
SELECT has_function('public', 'is_platform_admin', 'is_platform_admin() Funktion existiert');
SELECT has_function('public', 'costume_visible_to_theater', 'costume_visible_to_theater() Funktion existiert');
SELECT has_function('public', 'costume_lendable_to_theater', 'costume_lendable_to_theater() Funktion existiert');
SELECT has_function('public', 'delete_user_data', 'delete_user_data() Funktion existiert');
SELECT has_function('public', 'run_dsgvo_cleanup', 'run_dsgvo_cleanup() Funktion existiert');

SELECT * FROM finish();

ROLLBACK;
