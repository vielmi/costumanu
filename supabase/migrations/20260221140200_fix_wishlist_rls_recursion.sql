-- Fix infinite recursion between wishlists and wishlist_collaborators RLS policies.
-- The cycle: wishlists policy queries wishlist_collaborators,
-- whose policy queries wishlists back → infinite recursion.
-- Solution: use SECURITY DEFINER helpers that bypass RLS for cross-table checks.

-- Helper: check if current user owns a wishlist (bypasses RLS)
CREATE OR REPLACE FUNCTION is_wishlist_owner(check_wishlist_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM wishlists
    WHERE id = check_wishlist_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user is a collaborator on a wishlist (bypasses RLS)
CREATE OR REPLACE FUNCTION is_wishlist_collaborator(check_wishlist_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM wishlist_collaborators
    WHERE wishlist_id = check_wishlist_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop the old circular policies
DROP POLICY IF EXISTS "Collaborators can view wishlists" ON wishlists;
DROP POLICY IF EXISTS "Wishlist owner can manage collaborators" ON wishlist_collaborators;
DROP POLICY IF EXISTS "Collaborators can view co-collaborators" ON wishlist_collaborators;

-- Recreate without circular references
CREATE POLICY "Collaborators can view wishlists"
  ON wishlists FOR SELECT
  USING (is_wishlist_collaborator(id));

CREATE POLICY "Wishlist owner can manage collaborators"
  ON wishlist_collaborators FOR ALL
  USING (is_wishlist_owner(wishlist_id));

CREATE POLICY "Collaborators can view co-collaborators"
  ON wishlist_collaborators FOR SELECT
  USING (is_wishlist_collaborator(wishlist_id));
