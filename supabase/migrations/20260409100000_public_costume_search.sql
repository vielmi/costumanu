-- Public costume search: allow anonymous (unauthenticated) users to read
-- costumes and their related data, but ONLY if the costume has at least one
-- item explicitly marked as is_public_for_rent = true.
--
-- Security boundary:
--   ✅ Exposed:  costume name, description, media (photos), provenance, taxonomy
--   ❌ Hidden:   costume_items details (barcodes, RFID, storage location, sizes, condition)
--               profiles, theater_members, rental_orders, chat_messages, wishlist_items

-- Helper: reusable EXISTS check for public costumes
-- A costume is "public" when at least one of its items is marked for public rent.
-- This mirrors the existing "Public costumes visible to all authenticated" policy,
-- but extends it to the anon role as well.

CREATE POLICY "Anyone can view public costumes"
  ON costumes FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM costume_items ci
      WHERE ci.costume_id = id
        AND ci.is_public_for_rent = true
    )
  );

CREATE POLICY "Anyone can view public costume taxonomy"
  ON costume_taxonomy FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM costume_items ci
      WHERE ci.costume_id = costume_taxonomy.costume_id
        AND ci.is_public_for_rent = true
    )
  );

CREATE POLICY "Anyone can view public costume media"
  ON costume_media FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM costume_items ci
      WHERE ci.costume_id = costume_media.costume_id
        AND ci.is_public_for_rent = true
    )
  );

CREATE POLICY "Anyone can view public costume provenance"
  ON costume_provenance FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM costume_items ci
      WHERE ci.costume_id = costume_provenance.costume_id
        AND ci.is_public_for_rent = true
    )
  );
