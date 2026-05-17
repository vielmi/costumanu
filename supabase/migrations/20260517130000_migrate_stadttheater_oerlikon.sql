-- Migrate members from "Stadttheater Oerlikon" to "Theater Oerlikon",
-- then delete Stadttheater Oerlikon.

DO $$
DECLARE
  v_from_id uuid;
  v_to_id   uuid;
BEGIN
  SELECT id INTO v_from_id FROM theaters WHERE name = 'Stadttheater Oerlikon';
  SELECT id INTO v_to_id   FROM theaters WHERE name = 'Theater Oerlikon';

  IF v_from_id IS NULL THEN
    RAISE NOTICE 'Stadttheater Oerlikon not found — skipping.';
    RETURN;
  END IF;

  IF v_to_id IS NULL THEN
    RAISE EXCEPTION 'Theater Oerlikon not found — aborting.';
  END IF;

  -- Move members; skip if already a member of Theater Oerlikon
  INSERT INTO theater_members (theater_id, user_id, role, created_at)
  SELECT v_to_id, user_id, role, created_at
  FROM   theater_members
  WHERE  theater_id = v_from_id
  ON CONFLICT (theater_id, user_id) DO NOTHING;

  -- Delete source theater (CASCADE removes its theater_members rows)
  DELETE FROM theaters WHERE id = v_from_id;

  RAISE NOTICE 'Migrated members and deleted Stadttheater Oerlikon (%).', v_from_id;
END;
$$;
