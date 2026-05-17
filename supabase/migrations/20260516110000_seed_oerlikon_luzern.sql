-- ============================================================
-- SEED: Test-User für Oerlikon und Luzern
-- Gleiches Muster wie 20260413100000_seed_test_users.sql
-- Passwort für alle: Test1234!
-- ============================================================

-- ─── Theater ─────────────────────────────────────────────────
INSERT INTO theaters (id, name, slug) VALUES
  ('aaaaaaaa-0003-0000-0000-000000000000', 'Stadttheater Oerlikon', 'test-theater-oerlikon'),
  ('aaaaaaaa-0004-0000-0000-000000000000', 'Stadttheater Luzern',   'test-theater-luzern')
ON CONFLICT (slug) DO NOTHING;

-- ─── Auth-User ───────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, email_change,
  email_change_token_new, recovery_token
) VALUES
  -- Oerlikon
  ('cc030001-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'petra.oerlikon@test.palcopiu.com', extensions.crypt('Test1234!', extensions.gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}', FALSE,'','','',''),
  ('cc030002-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'otto.oerlikon@test.palcopiu.com',  extensions.crypt('Test1234!', extensions.gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}', FALSE,'','','',''),
  ('cc030003-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'ursina.oerlikon@test.palcopiu.com',extensions.crypt('Test1234!', extensions.gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}', FALSE,'','','',''),
  -- Luzern
  ('cc040001-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'markus.luzern@test.palcopiu.com',  extensions.crypt('Test1234!', extensions.gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}', FALSE,'','','',''),
  ('cc040002-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'sabine.luzern@test.palcopiu.com',  extensions.crypt('Test1234!', extensions.gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}', FALSE,'','','',''),
  ('cc040003-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'roland.luzern@test.palcopiu.com',  extensions.crypt('Test1234!', extensions.gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{}', FALSE,'','','','')
ON CONFLICT (id) DO NOTHING;

-- ─── Profile ─────────────────────────────────────────────────
INSERT INTO profiles (id, display_name) VALUES
  ('cc030001-0000-0000-0000-000000000000', 'Petra Produktionsleiterin'),
  ('cc030002-0000-0000-0000-000000000000', 'Otto Organisator'),
  ('cc030003-0000-0000-0000-000000000000', 'Ursina User'),
  ('cc040001-0000-0000-0000-000000000000', 'Markus Maskenbildner'),
  ('cc040002-0000-0000-0000-000000000000', 'Sabine Schneiderei'),
  ('cc040003-0000-0000-0000-000000000000', 'Roland Requisiteur')
ON CONFLICT (id) DO NOTHING;

-- ─── Theater-Mitgliedschaften ─────────────────────────────────
INSERT INTO theater_members (theater_id, user_id, role) VALUES
  -- Stadttheater Oerlikon
  ('aaaaaaaa-0003-0000-0000-000000000000', 'cc030001-0000-0000-0000-000000000000', 'owner'),
  ('aaaaaaaa-0003-0000-0000-000000000000', 'cc030002-0000-0000-0000-000000000000', 'member'),
  ('aaaaaaaa-0003-0000-0000-000000000000', 'cc030003-0000-0000-0000-000000000000', 'viewer'),
  -- Stadttheater Luzern
  ('aaaaaaaa-0004-0000-0000-000000000000', 'cc040001-0000-0000-0000-000000000000', 'owner'),
  ('aaaaaaaa-0004-0000-0000-000000000000', 'cc040002-0000-0000-0000-000000000000', 'member'),
  ('aaaaaaaa-0004-0000-0000-000000000000', 'cc040003-0000-0000-0000-000000000000', 'viewer')
ON CONFLICT DO NOTHING;
