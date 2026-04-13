-- ============================================================
-- MIGRATION: Fix — Chat-Teilnehmer dürfen Profile sehen
-- ============================================================
-- Problem: 20260411100000 hat Profile zu stark eingeschränkt.
-- Chat-Threads verbinden User aus verschiedenen Theatern (z.B.
-- bei Ausleihe-Anfragen). Diese müssen sich gegenseitig sehen.
-- ============================================================

CREATE POLICY "Chat participants can view each other profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_thread_participants ctp1
      JOIN chat_thread_participants ctp2 ON ctp1.thread_id = ctp2.thread_id
      WHERE ctp1.user_id = auth.uid()
        AND ctp2.user_id = profiles.id
    )
  );
