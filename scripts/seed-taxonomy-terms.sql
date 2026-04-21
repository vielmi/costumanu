-- ─── Seed: Globale Taxonomy Terms ─────────────────────────────────────────────
-- Ausführen im Supabase SQL Editor.
-- theater_id = NULL → globale Terme (für alle Theater sichtbar).
-- Stockwerk / Stange / Sektor werden pro Theater in der App selbst erfasst.

INSERT INTO taxonomy_terms (vocabulary, label_de, sort_order, theater_id)
VALUES

  -- ── Gender ──────────────────────────────────────────────────────────────────
  ('gender', 'Damen',    1, NULL),
  ('gender', 'Herren',   2, NULL),
  ('gender', 'Unisex',   3, NULL),
  ('gender', 'Kinder',   4, NULL),
  ('gender', 'Tier',     5, NULL),
  ('gender', 'Fantasy',  6, NULL),

  -- ── Bekleidungsart ──────────────────────────────────────────────────────────
  ('clothing_type', 'Kleider',          1, NULL),
  ('clothing_type', 'Röcke',            2, NULL),
  ('clothing_type', 'Blusen',           3, NULL),
  ('clothing_type', 'Hosen',            4, NULL),
  ('clothing_type', 'Anzüge',           5, NULL),
  ('clothing_type', 'Mäntel & Jacken',  6, NULL),
  ('clothing_type', 'Uniformen',        7, NULL),
  ('clothing_type', 'Kostüme',          8, NULL),
  ('clothing_type', 'Abendkleider',     9, NULL),
  ('clothing_type', 'Ballkleider',     10, NULL),
  ('clothing_type', 'Hochzeitskleider',11, NULL),
  ('clothing_type', 'Kopfbedeckungen', 12, NULL),

  -- ── Sparte ──────────────────────────────────────────────────────────────────
  ('sparte', 'Oper',           1, NULL),
  ('sparte', 'Schauspiel',     2, NULL),
  ('sparte', 'Musical',        3, NULL),
  ('sparte', 'Ballett',        4, NULL),
  ('sparte', 'Film',           5, NULL),
  ('sparte', 'Fernsehen',      6, NULL),
  ('sparte', 'Performance',    7, NULL),
  ('sparte', 'Kindertheater',  8, NULL),

  -- ── Material ────────────────────────────────────────────────────────────────
  ('material', 'Baumwolle',  1, NULL),
  ('material', 'Wolle',      2, NULL),
  ('material', 'Seide',      3, NULL),
  ('material', 'Satin',      4, NULL),
  ('material', 'Samt',       5, NULL),
  ('material', 'Tüll',       6, NULL),
  ('material', 'Brokat',     7, NULL),
  ('material', 'Taft',       8, NULL),
  ('material', 'Organza',    9, NULL),
  ('material', 'Spitze',    10, NULL),
  ('material', 'Damast',    11, NULL),
  ('material', 'Leder',     12, NULL),

  -- ── Muster ──────────────────────────────────────────────────────────────────
  ('muster', 'Uni',         1, NULL),
  ('muster', 'Gestreift',   2, NULL),
  ('muster', 'Kariert',     3, NULL),
  ('muster', 'Floral',      4, NULL),
  ('muster', 'Gepunktet',   5, NULL),
  ('muster', 'Ornamental',  6, NULL),
  ('muster', 'Abstrakt',    7, NULL),
  ('muster', 'Verlauf',     8, NULL),
  ('muster', 'Anderes',     9, NULL),

  -- ── Farbrichtung ────────────────────────────────────────────────────────────
  ('color', 'Schwarz',    1, NULL),
  ('color', 'Weiss',      2, NULL),
  ('color', 'Grau',       3, NULL),
  ('color', 'Beige',      4, NULL),
  ('color', 'Creme',      5, NULL),
  ('color', 'Braun',      6, NULL),
  ('color', 'Rot',        7, NULL),
  ('color', 'Bordeaux',   8, NULL),
  ('color', 'Orange',     9, NULL),
  ('color', 'Gelb',      10, NULL),
  ('color', 'Gold',      11, NULL),
  ('color', 'Grün',      12, NULL),
  ('color', 'Türkis',    13, NULL),
  ('color', 'Blau',      14, NULL),
  ('color', 'Violett',   15, NULL),
  ('color', 'Rosa',      16, NULL),
  ('color', 'Silber',    17, NULL),
  ('color', 'Multicolor',18, NULL),
  ('color', 'Transparent',19, NULL),

  -- ── Temperatur ──────────────────────────────────────────────────────────────
  ('temperature', 'Kalt',     1, NULL),
  ('temperature', 'Warm',     2, NULL),
  ('temperature', 'Neutral',  3, NULL),

  -- ── Reinigungsart ───────────────────────────────────────────────────────────
  ('washing_type', 'Handwäsche',       1, NULL),
  ('washing_type', 'Maschinenwäsche',  2, NULL),
  ('washing_type', 'Chemische Reinigung', 3, NULL),
  ('washing_type', 'Nicht waschen',    4, NULL),

  -- ── Trocknen ────────────────────────────────────────────────────────────────
  ('drying', 'Liegend trocknen',   1, NULL),
  ('drying', 'Hängend trocknen',   2, NULL),
  ('drying', 'Trockner erlaubt',   3, NULL),
  ('drying', 'Nicht im Trockner',  4, NULL),

  -- ── Bügeln ──────────────────────────────────────────────────────────────────
  ('ironing', 'Kalt bügeln',          1, NULL),
  ('ironing', 'Normal bügeln',         2, NULL),
  ('ironing', 'Heiss bügeln',          3, NULL),
  ('ironing', 'Nicht bügeln',          4, NULL),
  ('ironing', 'Nur mit Tuch bügeln',   5, NULL)

ON CONFLICT (vocabulary, label_de) DO NOTHING;
