-- Atomic function to create a personal theater + owner membership.
-- Uses SECURITY DEFINER to bypass the chicken-and-egg RLS problem:
-- the user can't SELECT the theater until they're a member,
-- but they can't become a member until the theater exists.
CREATE OR REPLACE FUNCTION bootstrap_personal_theater(p_name TEXT, p_slug TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_theater_id UUID;
BEGIN
  INSERT INTO theaters (name, slug)
  VALUES (p_name, p_slug)
  RETURNING id INTO v_theater_id;

  INSERT INTO theater_members (theater_id, user_id, role)
  VALUES (v_theater_id, auth.uid(), 'owner');

  RETURN v_theater_id;
END;
$$;
