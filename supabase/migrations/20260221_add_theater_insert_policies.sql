-- Allow authenticated users to create theaters
CREATE POLICY "Authenticated users can create theaters"
  ON theaters FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow users to add themselves as theater members
CREATE POLICY "Users can add themselves as members"
  ON theater_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
