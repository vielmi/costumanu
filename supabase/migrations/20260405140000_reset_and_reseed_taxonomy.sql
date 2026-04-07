-- ============================================================
-- Reset all taxonomy terms and re-seed from scratch.
-- All terms are global defaults (theater_id = NULL) and fully
-- editable/deletable by theater admins.
-- ============================================================

-- 1. Clear FK references so DELETE can proceed
UPDATE costumes SET gender_term_id = NULL, clothing_type_id = NULL;
DELETE FROM costume_taxonomy;
DELETE FROM taxonomy_terms;

-- ============================================================
-- 2. Drop old restrictive RLS policies and replace with open ones
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read taxonomy" ON taxonomy_terms;
DROP POLICY IF EXISTS "Members can read own theater taxonomy"  ON taxonomy_terms;
DROP POLICY IF EXISTS "Admins can insert taxonomy terms"       ON taxonomy_terms;
DROP POLICY IF EXISTS "Admins can update taxonomy terms"       ON taxonomy_terms;
DROP POLICY IF EXISTS "Admins can delete taxonomy terms"       ON taxonomy_terms;

-- All authenticated users can read all terms
CREATE POLICY "All authenticated users read taxonomy"
  ON taxonomy_terms FOR SELECT
  TO authenticated
  USING (true);

-- Admins/owners can insert terms (theater-scoped or global)
CREATE POLICY "Admins insert taxonomy"
  ON taxonomy_terms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM theater_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Admins/owners can update any term
CREATE POLICY "Admins update taxonomy"
  ON taxonomy_terms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM theater_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Admins/owners can delete any term
CREATE POLICY "Admins delete taxonomy"
  ON taxonomy_terms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM theater_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 3. Re-seed all vocabularies
-- ============================================================

-- ==================== gender (Allgemein) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('gender', 'Damen',   1),
  ('gender', 'Herren',  2),
  ('gender', 'Unisex',  3),
  ('gender', 'Kinder',  4),
  ('gender', 'Tier',    5),
  ('gender', 'Fantasy', 6),
  ('gender', 'Anderes', 7);

-- ==================== sparte (Sparte) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('sparte', 'Chor',       1),
  ('sparte', 'Film',       2),
  ('sparte', 'Musical',    3),
  ('sparte', 'Oper',       4),
  ('sparte', 'Orchester',  5),
  ('sparte', 'Schauspiel', 6),
  ('sparte', 'Tanz',       7),
  ('sparte', 'Anderes',    8);

-- ==================== clothing_type (Bekleidungsart) ====================
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
  ('clothing_type', 'Anderes',     15);

-- ==================== clothing_subtype (Bekleidungstyp) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('clothing_subtype', 'Ärmellos',        1),
  ('clothing_subtype', 'Abendkleid',      2),
  ('clothing_subtype', 'Bodenlang',       3),
  ('clothing_subtype', 'Coctailkleid',    4),
  ('clothing_subtype', 'Glockig',         5),
  ('clothing_subtype', 'Herz-Ausschnitt', 6),
  ('clothing_subtype', 'Hemdkleid',       7),
  ('clothing_subtype', 'Knöchellang',     8),
  ('clothing_subtype', 'mit Ärmel',       9),
  ('clothing_subtype', 'Raglanärmel',     10),
  ('clothing_subtype', 'Sommerkleid',     11),
  ('clothing_subtype', 'Stehkragen',      12),
  ('clothing_subtype', 'Anderes',         13);

-- ==================== material (Materialart) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('material', 'Baumwolle', 1),
  ('material', 'Batist',    2),
  ('material', 'Chiffron',  3),
  ('material', 'Cord',      4),
  ('material', 'Denim',     5),
  ('material', 'Leine',     6),
  ('material', 'Lyocell',   7),
  ('material', 'Polyester', 8),
  ('material', 'Samt',      9),
  ('material', 'Satin',     10),
  ('material', 'Seide',     11),
  ('material', 'Tüll',      12),
  ('material', 'Viskose',   13),
  ('material', 'Wolle',     14),
  ('material', 'Anderes',   15);

-- ==================== muster (Muster / Materialien) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('muster', 'Uni',       1),
  ('muster', 'Floral',    2),
  ('muster', 'Gemustert', 3),
  ('muster', 'Gepunktet', 4),
  ('muster', 'Gestreift', 5),
  ('muster', 'Kariert',   6),
  ('muster', 'Paisley',   7),
  ('muster', 'Abstrakt',  8),
  ('muster', 'Tierprint', 9),
  ('muster', 'Bestickt',  10),
  ('muster', 'Anderes',   11);

-- ==================== color (Farbrichtung) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('color', 'Beige',    1),
  ('color', 'Blau',     2),
  ('color', 'Bordeaux', 3),
  ('color', 'Braun',    4),
  ('color', 'Gelb',     5),
  ('color', 'Gold',     6),
  ('color', 'Grau',     7),
  ('color', 'Grün',     8),
  ('color', 'Orange',   9),
  ('color', 'Rosa',     10),
  ('color', 'Rot',      11),
  ('color', 'Schwarz',  12),
  ('color', 'Silber',   13),
  ('color', 'Türkis',   14),
  ('color', 'Violett',  15),
  ('color', 'Weiss',    16),
  ('color', 'Anderes',  17);

-- ==================== temperature (Temperatur) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('temperature', '20°',    1),
  ('temperature', '30°',    2),
  ('temperature', '40°',    3),
  ('temperature', '60°',    4),
  ('temperature', 'Anderes', 5);

-- ==================== washing_type (Reinigungsart) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('washing_type', 'Maschinenwäsche',    1),
  ('washing_type', 'Handwäsche',         2),
  ('washing_type', 'Chemische Reinigung', 3),
  ('washing_type', 'Nicht waschen',      4),
  ('washing_type', 'Nicht bleichen',     5),
  ('washing_type', 'Anderes',            6);

-- ==================== drying (Trocknen) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('drying', 'Lufttrocknen',       1),
  ('drying', 'Trockner',           2),
  ('drying', 'Nicht im Trockner',  3),
  ('drying', 'Anderes',            4);

-- ==================== ironing (Bügeln) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('ironing', 'Mit Dampf',    1),
  ('ironing', 'Ohne Dampf',   2),
  ('ironing', 'Nicht bügeln', 3),
  ('ironing', 'Anderes',      4);

-- ==================== floor (Stockwerk) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('floor', '1',       1),
  ('floor', '2',       2),
  ('floor', '3',       3),
  ('floor', '4',       4),
  ('floor', '5',       5),
  ('floor', 'Anderes', 6);

-- ==================== rail (Stange) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('rail', '1',       1),
  ('rail', '2',       2),
  ('rail', '3',       3),
  ('rail', '4',       4),
  ('rail', '5',       5),
  ('rail', '6',       6),
  ('rail', '7',       7),
  ('rail', '8',       8),
  ('rail', '9',       9),
  ('rail', '10',      10),
  ('rail', 'Anderes', 11);

-- ==================== sector (Sektor) ====================
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order) VALUES
  ('sector', 'A',       1),
  ('sector', 'B',       2),
  ('sector', 'C',       3),
  ('sector', 'D',       4),
  ('sector', 'E',       5),
  ('sector', 'F',       6),
  ('sector', 'G',       7),
  ('sector', 'H',       8),
  ('sector', 'Anderes', 9);
