-- ============================================================
-- SEED: Test-User für E2E-Tests
-- ============================================================
-- Nur in Entwicklung/Staging ausführen — NIE in Production.
-- Erstellt 2 Theater mit je owner, member, viewer.
-- ============================================================
-- Feste UUIDs damit Tests deterministisch sind.
-- Passwörter werden via Supabase Auth Admin API gesetzt
-- (nicht via SQL — Passwort-Hashing ist Sache der Auth-Engine).
-- Dieses Script erstellt Profile + Theater-Mitgliedschaften,
-- NACHDEM die User via Dashboard oder Admin-API angelegt wurden.
-- ============================================================

-- ─── Test-Theater ────────────────────────────────────────────
INSERT INTO theaters (id, name, slug) VALUES
  ('aaaaaaaa-0001-0000-0000-000000000000', 'Stadttheater Zürich',  'test-theater-zuerich'),
  ('aaaaaaaa-0002-0000-0000-000000000000', 'Stadttheater Bern',    'test-theater-bern')
ON CONFLICT (slug) DO NOTHING;

-- ─── Profile ─────────────────────────────────────────────────
INSERT INTO profiles (id, display_name) VALUES
  ('32979944-4c10-4df8-886f-463e1c0801ac', 'Finja Fundusleitung'),
  ('76ba0917-0d7f-46cc-a9fd-e722f507c252', 'Alma Assistentin'),
  ('b120f3c3-c21c-45a1-8b45-9d9ddb75ab33', 'Viktor Volontär'),
  ('f8f04727-68fd-4a58-85d7-06c7fd35bc50', 'Klara Kostümleitung'),
  ('478d3fca-b1af-46ca-aaa7-43f7015d26e7', 'Sina Schneiderin'),
  ('73a01d02-157b-4784-b7c5-1db065ef84e4', 'Leo Lehrling')
ON CONFLICT (id) DO NOTHING;

-- ─── Theater-Mitgliedschaften ─────────────────────────────────
INSERT INTO theater_members (theater_id, user_id, role) VALUES
  -- Stadttheater Zürich
  ('aaaaaaaa-0001-0000-0000-000000000000', '32979944-4c10-4df8-886f-463e1c0801ac', 'owner'),
  ('aaaaaaaa-0001-0000-0000-000000000000', '76ba0917-0d7f-46cc-a9fd-e722f507c252', 'member'),
  ('aaaaaaaa-0001-0000-0000-000000000000', 'b120f3c3-c21c-45a1-8b45-9d9ddb75ab33', 'viewer'),
  -- Stadttheater Bern
  ('aaaaaaaa-0002-0000-0000-000000000000', 'f8f04727-68fd-4a58-85d7-06c7fd35bc50', 'owner'),
  ('aaaaaaaa-0002-0000-0000-000000000000', '478d3fca-b1af-46ca-aaa7-43f7015d26e7', 'member'),
  ('aaaaaaaa-0002-0000-0000-000000000000', '73a01d02-157b-4784-b7c5-1db065ef84e4', 'viewer')
ON CONFLICT DO NOTHING;
