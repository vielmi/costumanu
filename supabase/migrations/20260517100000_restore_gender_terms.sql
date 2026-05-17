-- Restore deleted gender taxonomy terms "Kinder" and "Anderes"
INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order)
VALUES
  ('gender', 'Kinder',  4),
  ('gender', 'Anderes', 7)
ON CONFLICT DO NOTHING;
