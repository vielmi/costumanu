-- Remove duplicate Stadttheater Luzern created via UI (slug: stadttheater-luzern)
-- The seed entry (slug: test-theater-luzern, id: aaaaaaaa-0004-...) is kept.
DELETE FROM theaters WHERE slug = 'stadttheater-luzern';

-- Enforce unique theater names platform-wide
ALTER TABLE theaters ADD CONSTRAINT theaters_name_unique UNIQUE (name);
