-- ============================================================
-- MIGRATION: Fix — theater_members RLS Regression
-- ============================================================
-- Problem: Die Policy "Members can view co-members" prüft
-- is_member_of(theater_id). Diese SECURITY DEFINER Funktion
-- liest theater_members ohne RLS — sollte funktionieren.
--
-- Aber: Es gibt keinen direkten Policy-Pfad für einen User,
-- der seine EIGENE Mitgliedschaft sehen will. Wenn durch
-- Timing, Caching oder einen Trigger-Fehler is_member_of()
-- false zurückgibt, findet der User seine Zeile nicht.
--
-- Fix: Direkte Policy "user_id = auth.uid()" hinzufügen.
-- So kann jeder User seine eigenen theater_members-Zeilen
-- immer lesen — unabhängig von is_member_of().
--
-- Zusätzlich: Migration 20260411140000 hat versucht, eine
-- bereits in 20260411100000 existierende Policy zu erstellen
-- → DROP IF EXISTS + CREATE um idempotent zu sein.
-- ============================================================

-- ============================================================
-- 1. THEATER_MEMBERS: Direkte Self-Lookup Policy
-- ============================================================

-- Füge direkte Policy hinzu: User sieht immer seine eigenen Mitgliedschaften
CREATE POLICY "Users can view their own membership"
  ON theater_members FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- 2. PROFILE CHAT VISIBILITY: Idempotent Fix
-- ============================================================
-- 20260411100000 hat "Chat participants can view each other profiles"
-- bereits erstellt. 20260411140000 hat versucht, sie nochmals zu
-- erstellen → dieser Block stellt sicher, dass genau eine korrekte
-- Version existiert.

DROP POLICY IF EXISTS "Chat participants can view each other profiles" ON profiles;

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
