-- ============================================================
-- MIGRATION: Subscription Tiers (BC §12)
-- ============================================================
-- Jedes Theater hat ein Subscription-Tier das bestimmt,
-- welche Features verfügbar sind.
--
-- Tiers (aufsteigend):
--   free → starter → standard → pro → premium → enterprise
--
-- Feature-Mapping:
--   network_sharing  Starter+  Kostüme für Netzwerk freigeben
--   custom_fields    Standard+ Eigene Felder definieren
--   network_admin    Pro+      Netzwerk-Admin-Rolle
-- ============================================================

-- ─── 1. Subscriptions-Tabelle ────────────────────────────────────────────────

CREATE TABLE subscriptions (
  theater_id              UUID PRIMARY KEY REFERENCES theaters(id) ON DELETE CASCADE,
  tier                    TEXT NOT NULL DEFAULT 'free'
                          CHECK (tier IN ('free','starter','standard','pro','premium','enterprise')),
  valid_until             TIMESTAMPTZ DEFAULT NULL,  -- NULL = unbegrenzt
  stripe_subscription_id  TEXT DEFAULT NULL,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE subscriptions IS
  'Ein Eintrag pro Theater. Fehlt kein Eintrag, gilt ''free''.';

-- Alle bestehenden Theater erhalten Tier ''free''
INSERT INTO subscriptions (theater_id, tier)
SELECT id, 'free' FROM theaters
ON CONFLICT DO NOTHING;

-- ─── 2. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Theater members can view their subscription"
  ON subscriptions FOR SELECT
  USING (is_member_of(theater_id) OR is_platform_admin());

CREATE POLICY "Platform admin can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (is_platform_admin());

-- ─── 3. Helper-Funktionen ────────────────────────────────────────────────────

-- Gibt den aktuellen Tier eines Theaters zurück ('free' als Fallback)
CREATE OR REPLACE FUNCTION theater_tier(p_theater_id UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT tier FROM subscriptions
     WHERE theater_id = p_theater_id
       AND (valid_until IS NULL OR valid_until > now())),
    'free'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Prüft ob ein Theater Zugriff auf ein Feature hat
CREATE OR REPLACE FUNCTION has_feature(p_theater_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
  DECLARE
    tier_order   INTEGER;
    min_order    INTEGER;
  BEGIN
    tier_order := CASE theater_tier(p_theater_id)
      WHEN 'free'       THEN 0
      WHEN 'starter'    THEN 1
      WHEN 'standard'   THEN 2
      WHEN 'pro'        THEN 3
      WHEN 'premium'    THEN 4
      WHEN 'enterprise' THEN 5
      ELSE 0
    END;
    min_order := CASE p_feature
      WHEN 'network_sharing' THEN 1   -- Starter+
      WHEN 'custom_fields'   THEN 2   -- Standard+
      WHEN 'network_admin'   THEN 3   -- Pro+
      ELSE 999
    END;
    RETURN tier_order >= min_order;
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Hilfreich im RLS: kein Kostüm-Netzwerk-Sharing für Free-Tier
-- (wird optional in costume_network_visibility-Policies verwendet)
COMMENT ON FUNCTION has_feature IS
  'Gibt true zurück wenn p_theater_id Zugriff auf p_feature hat. '
  'Features: network_sharing (Starter+), custom_fields (Standard+), network_admin (Pro+).';
