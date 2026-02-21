-- ============================================================
-- Seed taxonomy terms for all vocabularies
-- Idempotent: ON CONFLICT DO NOTHING
-- ============================================================

-- ==================== gender ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('gender', 'Damen', 1),
  ('gender', 'Herren', 2),
  ('gender', 'Unisex', 3),
  ('gender', 'Kinder', 4),
  ('gender', 'Tier', 5),
  ('gender', 'Fantasy', 6)
ON CONFLICT (vocabulary, label_de) DO NOTHING;

-- ==================== clothing_type (top-level) ====================
-- Fixed UUIDs for top-level entries so sub-types can reference them via parent_id.
INSERT INTO taxonomy_terms (id, vocabulary, label_de, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'clothing_type', 'Kleider', 1),
  ('a0000000-0000-0000-0000-000000000002', 'clothing_type', 'Anzüge', 2),
  ('a0000000-0000-0000-0000-000000000003', 'clothing_type', 'Hosen', 3),
  ('a0000000-0000-0000-0000-000000000004', 'clothing_type', 'Hemden & Blusen', 4),
  ('a0000000-0000-0000-0000-000000000005', 'clothing_type', 'Mäntel & Jacken', 5),
  ('a0000000-0000-0000-0000-000000000006', 'clothing_type', 'Röcke', 6),
  ('a0000000-0000-0000-0000-000000000007', 'clothing_type', 'Westen', 7),
  ('a0000000-0000-0000-0000-000000000008', 'clothing_type', 'Uniformen', 8),
  ('a0000000-0000-0000-0000-000000000009', 'clothing_type', 'Kopfbedeckungen', 9),
  ('a0000000-0000-0000-0000-00000000000a', 'clothing_type', 'Schuhe', 10),
  ('a0000000-0000-0000-0000-00000000000b', 'clothing_type', 'Accessoires', 11),
  ('a0000000-0000-0000-0000-00000000000c', 'clothing_type', 'Unterwäsche & Korsetts', 12),
  ('a0000000-0000-0000-0000-00000000000d', 'clothing_type', 'Kostüme (Komplett)', 13),
  ('a0000000-0000-0000-0000-00000000000e', 'clothing_type', 'Oberbekleidung', 14),
  ('a0000000-0000-0000-0000-00000000000f', 'clothing_type', 'Schmuck', 15),
  ('a0000000-0000-0000-0000-000000000010', 'clothing_type', 'Sonstiges', 16)
ON CONFLICT (vocabulary, label_de) DO NOTHING;

-- ==================== clothing_type (sub-types) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, parent_id, sort_order) VALUES
  -- Kleider sub-types
  ('clothing_type', 'Abendkleid', 'a0000000-0000-0000-0000-000000000001', 1),
  ('clothing_type', 'Cocktailkleid', 'a0000000-0000-0000-0000-000000000001', 2),
  ('clothing_type', 'Ballkleid', 'a0000000-0000-0000-0000-000000000001', 3),
  ('clothing_type', 'Alltagskleid', 'a0000000-0000-0000-0000-000000000001', 4),
  -- Anzüge sub-types
  ('clothing_type', 'Frack', 'a0000000-0000-0000-0000-000000000002', 1),
  ('clothing_type', 'Smoking', 'a0000000-0000-0000-0000-000000000002', 2),
  ('clothing_type', 'Gehrock', 'a0000000-0000-0000-0000-000000000002', 3),
  -- Mäntel & Jacken sub-types
  ('clothing_type', 'Mantel', 'a0000000-0000-0000-0000-000000000005', 1),
  ('clothing_type', 'Cape', 'a0000000-0000-0000-0000-000000000005', 2),
  ('clothing_type', 'Umhang', 'a0000000-0000-0000-0000-000000000005', 3),
  ('clothing_type', 'Jacke', 'a0000000-0000-0000-0000-000000000005', 4),
  ('clothing_type', 'Bolero', 'a0000000-0000-0000-0000-000000000005', 5),
  -- Kopfbedeckungen sub-types
  ('clothing_type', 'Hut', 'a0000000-0000-0000-0000-000000000009', 1),
  ('clothing_type', 'Krone', 'a0000000-0000-0000-0000-000000000009', 2),
  ('clothing_type', 'Schleier', 'a0000000-0000-0000-0000-000000000009', 3),
  ('clothing_type', 'Haube', 'a0000000-0000-0000-0000-000000000009', 4),
  -- Accessoires sub-types
  ('clothing_type', 'Handschuhe', 'a0000000-0000-0000-0000-00000000000b', 1),
  ('clothing_type', 'Fächer', 'a0000000-0000-0000-0000-00000000000b', 2),
  ('clothing_type', 'Gürtel', 'a0000000-0000-0000-0000-00000000000b', 3),
  ('clothing_type', 'Tasche', 'a0000000-0000-0000-0000-00000000000b', 4)
ON CONFLICT (vocabulary, label_de) DO NOTHING;

-- ==================== epoche ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('epoche', 'Antike', 1),
  ('epoche', 'Frühmittelalter', 2),
  ('epoche', 'Hochmittelalter', 3),
  ('epoche', 'Spätmittelalter', 4),
  ('epoche', 'Renaissance', 5),
  ('epoche', 'Barock', 6),
  ('epoche', 'Rokoko', 7),
  ('epoche', 'Klassizismus', 8),
  ('epoche', 'Empire', 9),
  ('epoche', 'Biedermeier', 10),
  ('epoche', 'Gründerzeit', 11),
  ('epoche', 'Jugendstil', 12),
  ('epoche', 'Zwanziger Jahre', 13),
  ('epoche', 'Dreissiger/Vierziger Jahre', 14),
  ('epoche', 'Fünfziger/Sechziger Jahre', 15),
  ('epoche', 'Siebziger/Achtziger Jahre', 16),
  ('epoche', 'Zeitgenössisch', 17)
ON CONFLICT (vocabulary, label_de) DO NOTHING;

-- ==================== material ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('material', 'Baumwolle', 1),
  ('material', 'Seide', 2),
  ('material', 'Polyester', 3),
  ('material', 'Chiffon', 4),
  ('material', 'Satin', 5),
  ('material', 'Leinen', 6),
  ('material', 'Wolle', 7),
  ('material', 'Leder', 8),
  ('material', 'Samt', 9),
  ('material', 'Tüll', 10),
  ('material', 'Spitze', 11),
  ('material', 'Brokat', 12),
  ('material', 'Organza', 13),
  ('material', 'Jersey', 14),
  ('material', 'Tweed', 15),
  ('material', 'Pelz (Kunst)', 16),
  ('material', 'Neopren', 17),
  ('material', 'Mischgewebe', 18)
ON CONFLICT (vocabulary, label_de) DO NOTHING;

-- ==================== materialoptik ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('materialoptik', 'Glänzend', 1),
  ('materialoptik', 'Matt', 2),
  ('materialoptik', 'Transparent', 3),
  ('materialoptik', 'Satin', 4),
  ('materialoptik', 'Metallic', 5),
  ('materialoptik', 'Strukturiert', 6)
ON CONFLICT (vocabulary, label_de) DO NOTHING;

-- ==================== muster ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('muster', 'Uni', 1),
  ('muster', 'Floral', 2),
  ('muster', 'Gemustert', 3),
  ('muster', 'Gepunktet', 4),
  ('muster', 'Gestreift', 5),
  ('muster', 'Kariert', 6),
  ('muster', 'Paisley', 7),
  ('muster', 'Abstrakt', 8),
  ('muster', 'Tierprint', 9),
  ('muster', 'Bestickt', 10)
ON CONFLICT (vocabulary, label_de) DO NOTHING;

-- ==================== color ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('color', 'Beige', 1),
  ('color', 'Rosa', 2),
  ('color', 'Braun', 3),
  ('color', 'Schwarz', 4),
  ('color', 'Blau', 5),
  ('color', 'Rot', 6),
  ('color', 'Grau', 7),
  ('color', 'Gold', 8),
  ('color', 'Weiss', 9),
  ('color', 'Grün', 10),
  ('color', 'Gelb', 11),
  ('color', 'Orange', 12),
  ('color', 'Lila', 13),
  ('color', 'Silber', 14),
  ('color', 'Türkis', 15),
  ('color', 'Bordeaux', 16)
ON CONFLICT (vocabulary, label_de) DO NOTHING;

-- ==================== sparte ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('sparte', 'Film', 1),
  ('sparte', 'Schauspiel', 2),
  ('sparte', 'Kino', 3),
  ('sparte', 'Oper', 4),
  ('sparte', 'Tanz', 5),
  ('sparte', 'Musical', 6),
  ('sparte', 'Anderes', 7)
ON CONFLICT (vocabulary, label_de) DO NOTHING;

-- ==================== washing_instruction ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('washing_instruction', '30° Wäsche', 1),
  ('washing_instruction', '40° Wäsche', 2),
  ('washing_instruction', '60° Wäsche', 3),
  ('washing_instruction', 'Handwäsche', 4),
  ('washing_instruction', 'Chemische Reinigung', 5),
  ('washing_instruction', 'Nicht waschen', 6),
  ('washing_instruction', 'Nicht schleudern', 7),
  ('washing_instruction', 'Nicht bleichen', 8),
  ('washing_instruction', 'Bügeln Stufe 1', 9),
  ('washing_instruction', 'Nicht im Trockner', 10)
ON CONFLICT (vocabulary, label_de) DO NOTHING;
