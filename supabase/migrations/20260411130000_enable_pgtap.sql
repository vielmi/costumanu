-- ============================================================
-- MIGRATION: pg_tap Extension aktivieren
-- ============================================================
-- pg_tap ist ein Test-Framework für PostgreSQL.
-- Nur für lokale Entwicklung und Staging — nicht für Produktion.
-- Docs: https://pgtap.org
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgtap;
