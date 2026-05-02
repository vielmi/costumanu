-- Re-add epoche taxonomy terms (deleted by reset migration 20260405140000).
-- Used by suchmodus cockpit tiles and filter page.
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order)
SELECT v.vocabulary, v.label_de, v.sort_order
FROM (VALUES
  ('epoche', 'Barock',         1),
  ('epoche', '20-er Jahre',    2),
  ('epoche', '80-er Jahre',    3),
  ('epoche', 'Antike',         4),
  ('epoche', 'Mittelalter',    5),
  ('epoche', 'Renaissance',    6),
  ('epoche', 'Rokoko',         7),
  ('epoche', 'Biedermeier',    8),
  ('epoche', 'Jugendstil',     9),
  ('epoche', 'Zeitgenössisch', 10)
) AS v(vocabulary, label_de, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM taxonomy_terms t
  WHERE t.vocabulary = v.vocabulary AND t.label_de = v.label_de
);
