-- ============================================================
-- Seed all entries currently hardcoded in the UI
-- Idempotent: ON CONFLICT DO NOTHING
-- ============================================================

-- ==================== clothing_type (top-level radio cards) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('clothing_type', 'Anzug',       1),
  ('clothing_type', 'Bluse',       2),
  ('clothing_type', 'Hemd',        3),
  ('clothing_type', 'Hose',        4),
  ('clothing_type', 'Jacken',      5),
  ('clothing_type', 'Jupe',        6),
  ('clothing_type', 'Kleid',       7),
  ('clothing_type', 'Pullover',    8),
  ('clothing_type', 'Mäntel',      9),
  ('clothing_type', 'Shirt',       10),
  ('clothing_type', 'Uniform',     11),
  ('clothing_type', 'Plastisch',   12),
  ('clothing_type', 'Accessoires', 13),
  ('clothing_type', 'Schuhe',      14),
  ('clothing_type', 'Anderes',     15)
ON CONFLICT (vocabulary, label_de) DO NOTHING;

-- ==================== clothing_subtype (suggestion pills) ====================
-- Stored as separate vocabulary so they are manageable independently
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('clothing_subtype', 'Ärmellos',       1),
  ('clothing_subtype', 'Abendkleid',     2),
  ('clothing_subtype', 'Bodenlang',      3),
  ('clothing_subtype', 'Coctailkleid',   4),
  ('clothing_subtype', 'Glockig',        5),
  ('clothing_subtype', 'Herz-Ausschnitt', 6),
  ('clothing_subtype', 'Hemdkleid',      7),
  ('clothing_subtype', 'Knöchellang',    8),
  ('clothing_subtype', 'mit Ärmel',      9),
  ('clothing_subtype', 'Raglanärmel',    10),
  ('clothing_subtype', 'Sommerkleid',    11),
  ('clothing_subtype', 'Stehkragen',     12),
  ('clothing_subtype', 'Anderes',        13)
ON CONFLICT (vocabulary, label_de) DO NOTHING;

-- ==================== material (add missing UI entries) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('material', 'Chiffron',  19),
  ('material', 'Cord',      20),
  ('material', 'Denim',     21),
  ('material', 'Leine',     22),
  ('material', 'Lyocell',   23),
  ('material', 'Viskose',   24),
  ('material', 'Batist',    25),
  ('material', 'Anderes',   26)
ON CONFLICT (vocabulary, label_de) DO NOTHING;
