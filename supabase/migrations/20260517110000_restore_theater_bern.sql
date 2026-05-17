-- Restore accidentally deleted Stadttheater Bern (original seed ID)
INSERT INTO theaters (id, name, slug)
VALUES ('aaaaaaaa-0002-0000-0000-000000000000', 'Stadttheater Bern', 'test-theater-bern')
ON CONFLICT (id) DO NOTHING;

-- Restore theater memberships
INSERT INTO theater_members (theater_id, user_id, role)
VALUES
  ('aaaaaaaa-0002-0000-0000-000000000000', 'f8f04727-68fd-4a58-85d7-06c7fd35bc50', 'owner'),
  ('aaaaaaaa-0002-0000-0000-000000000000', '478d3fca-b1af-46ca-aaa7-43f7015d26e7', 'member'),
  ('aaaaaaaa-0002-0000-0000-000000000000', '73a01d02-157b-4784-b7c5-1db065ef84e4', 'viewer')
ON CONFLICT DO NOTHING;
