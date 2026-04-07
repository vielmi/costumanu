-- ============================================================
-- Platform Admin Role
-- Adds a platform_role column to profiles to designate users
-- who can manage all theaters (not just their own).
-- ============================================================

-- 1. Add platform_role column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS platform_role text
  CHECK (platform_role IS NULL OR platform_role = 'platform_admin');

-- 2. Set manuela.vielmi@gmail.com as platform admin
UPDATE profiles
SET platform_role = 'platform_admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'manuela.vielmi@gmail.com'
);

-- 3. Allow platform admins to insert new theaters
CREATE POLICY "Platform admins can insert theaters"
  ON theaters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND platform_role = 'platform_admin'
    )
  );

-- 4. Allow platform admins to update any theater
CREATE POLICY "Platform admins can update theaters"
  ON theaters FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND platform_role = 'platform_admin'
    )
  );

-- 5. Allow platform admins to view all theater_members
--    (theater admins already see their own via "Members can view co-members")
CREATE POLICY "Platform admins can view all theater_members"
  ON theater_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND platform_role = 'platform_admin'
    )
  );
