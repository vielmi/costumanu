-- Move Abendkleid, Ballkleid, Hochzeitskleid from clothing_type to
-- clothing_subtype under "Kleid".
DO $$
DECLARE
  kleid_id UUID;
BEGIN
  SELECT id INTO kleid_id
    FROM taxonomy_terms
   WHERE vocabulary = 'clothing_type' AND label_de = 'Kleid';

  IF kleid_id IS NULL THEN
    RAISE EXCEPTION 'clothing_type "Kleid" not found';
  END IF;

  -- Re-assign any costumes whose clothing_type_id pointed to these terms
  UPDATE costumes
     SET clothing_type_id = kleid_id
   WHERE clothing_type_id IN (
     SELECT id FROM taxonomy_terms
      WHERE vocabulary = 'clothing_type'
        AND label_de IN ('Abendkleid', 'Ballkleid', 'Hochzeitskleid')
   );

  -- Convert the terms themselves to clothing_subtype under Kleid
  UPDATE taxonomy_terms
     SET vocabulary = 'clothing_subtype',
         parent_id  = kleid_id
   WHERE vocabulary = 'clothing_type'
     AND label_de IN ('Abendkleid', 'Ballkleid', 'Hochzeitskleid');

  -- Also fix any pre-existing clothing_subtype rows missing the parent link
  UPDATE taxonomy_terms
     SET parent_id = kleid_id
   WHERE vocabulary = 'clothing_subtype'
     AND label_de IN ('Abendkleid', 'Ballkleid', 'Hochzeitskleid')
     AND parent_id IS DISTINCT FROM kleid_id;

  -- Insert any that do not exist at all yet
  INSERT INTO taxonomy_terms (vocabulary, label_de, parent_id, sort_order)
    SELECT 'clothing_subtype', v.label_de, kleid_id, v.ord
      FROM (VALUES ('Abendkleid', 2), ('Ballkleid', 3), ('Hochzeitskleid', 4)) AS v(label_de, ord)
     WHERE NOT EXISTS (
       SELECT 1 FROM taxonomy_terms
        WHERE vocabulary = 'clothing_subtype' AND label_de = v.label_de
     );
END
$$;
