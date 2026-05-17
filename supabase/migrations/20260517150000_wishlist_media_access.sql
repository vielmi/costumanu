-- Authenticated users can read costume_media for any costume in their own
-- wishlists. Without this, images are blocked for costumes that are not
-- is_public_for_rent = true, even though the user already has the costume
-- saved in their wishlist.
CREATE POLICY "Authenticated can view media of own wishlisted costumes"
  ON costume_media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
        FROM wishlist_items wi
        JOIN wishlists w ON w.id = wi.wishlist_id
       WHERE wi.costume_id = costume_media.costume_id
         AND w.owner_id = auth.uid()
    )
  );
