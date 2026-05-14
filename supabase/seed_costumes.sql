-- ============================================================
-- Kostüm-Seed: 3 Kostüme pro Theater
-- Theater: Stadttheater Bern, Stadttheater Zürich,
--          Stadttheater Luzern, Theater Oerlikon
-- Ausführen: Supabase SQL Editor → New query → Paste → Run
-- ============================================================

DO $$
DECLARE
  -- ── Theater IDs ──────────────────────────────────────────
  th_bern     CONSTANT UUID := 'aaaaaaaa-0002-0000-0000-000000000000';
  th_zuerich  CONSTANT UUID := 'aaaaaaaa-0001-0000-0000-000000000000';
  th_luzern   CONSTANT UUID := '2081f96e-d806-4e53-92d4-d150c84f7e2c';
  th_oerlikon CONSTANT UUID := '6426a71b-2597-4de0-b18f-6f9d4ec4d6eb';

  -- ── Kostüm-IDs (Variablen für RETURNING) ─────────────────
  c1 UUID; c2 UUID; c3 UUID;
  c4 UUID; c5 UUID; c6 UUID;
  c7 UUID; c8 UUID; c9 UUID;
  c10 UUID; c11 UUID; c12 UUID;

  -- ── Taxonomy-IDs: Gender ─────────────────────────────────
  g_damen   CONSTANT UUID := '184eb0e5-c60b-4c99-b889-6f5d5657366b';
  g_herren  CONSTANT UUID := '93781156-76fe-4ecc-9d2f-f7ec40d55816';
  g_unisex  CONSTANT UUID := '724f4984-eaa1-4aef-b231-031765b3e545';

  -- ── Taxonomy-IDs: Clothing Type ──────────────────────────
  ct_kleid    CONSTANT UUID := 'a879f7cc-7536-425c-8df8-ab19ddf647b5';
  ct_hose     CONSTANT UUID := 'b0dee814-b8e9-45e4-9b4b-387095f447ac';
  ct_anzug    CONSTANT UUID := '05ef4ac7-527f-40c3-bb23-54b44a5fa05f';
  ct_mantel   CONSTANT UUID := '92996f5b-d920-4db6-8d82-e8d6c812fff9';
  ct_uniform  CONSTANT UUID := 'cc75460b-3213-41d2-9127-6867ac886371';
  ct_kostuem  CONSTANT UUID := 'b9a88c97-a721-44c6-adf9-c7aae205280c';
  ct_abend    CONSTANT UUID := '9d63b4fe-ace4-4b60-b84b-e0c5b9e527ed';
  ct_ball     CONSTANT UUID := '59fe557d-363c-4583-9591-903985e0fc37';

  -- ── Taxonomy-IDs: Subtype ────────────────────────────────
  st_lang_mantel CONSTANT UUID := '75777492-8b23-4c59-8e00-f541ac8aad19';
  st_frack       CONSTANT UUID := '29ad0f27-36e5-4841-af4a-9bcb27cbaa2c';
  st_militaer    CONSTANT UUID := 'a12e9c8c-eb0a-436c-8a9f-3bbdc577c239';
  st_robe        CONSTANT UUID := 'e3a74a58-075d-4d75-93c8-9a9ad39ad7ef';
  st_smoking     CONSTANT UUID := '888be9ef-c8e0-4cf7-bd59-cae580b52991';
  st_clown       CONSTANT UUID := '64eedf0d-fa02-4988-9e66-8550e5ca8229';
  st_empire      CONSTANT UUID := 'cebd127c-2454-4798-a3e9-75506f818fa0';
  st_historisch  CONSTANT UUID := 'c721d54b-ab9a-4281-9d5d-80c1c595e235';
  st_fantasy     CONSTANT UUID := '0434f4e7-3bb9-41ea-8558-b517f4661c03';
  st_zweiteilig  CONSTANT UUID := '03f64a35-fbc9-45e6-b066-588929fd7e1b';

  -- ── Taxonomy-IDs: Material ───────────────────────────────
  m_seide     CONSTANT UUID := '4ad860b6-f6d5-48c9-87b7-cb61fee14b5a';
  m_samt      CONSTANT UUID := 'ff3041ec-7c3c-4d55-8eec-7216e3e77ae9';
  m_wolle     CONSTANT UUID := '543aa082-4e54-49e4-936f-53d44beef56a';
  m_tuell     CONSTANT UUID := '2fd11207-52e4-4885-8d51-a1f0a531d11c';
  m_satin     CONSTANT UUID := 'a8009d27-5602-40ae-8a0e-5f8c42ff1c8b';
  m_spitze    CONSTANT UUID := 'aaad8201-bada-445b-b83b-e3949ee6c0df';
  m_polyester CONSTANT UUID := '745df5a3-03df-4695-8c53-3e269a2def4c';
  m_baumwolle CONSTANT UUID := 'dc596707-01e4-4d95-b912-f65f3f152982';
  m_brokat    CONSTANT UUID := '83ab7071-d3ee-4b8f-98ea-eb18629a009d';
  m_organza   CONSTANT UUID := '19eabe3d-64a5-431e-8145-6786087fcae2';
  m_leder     CONSTANT UUID := 'af61e809-6244-45c8-adb7-743a2156d422';
  m_viskose   CONSTANT UUID := '1b0b70bb-c2d1-4c37-883a-b8a5f83a90f5';

  -- ── Taxonomy-IDs: Farbe ──────────────────────────────────
  col_schwarz  CONSTANT UUID := '561ed8e2-14cc-49fa-ae64-5762091d4d71';
  col_rot      CONSTANT UUID := '041769a1-38f2-4f10-b2d7-e87ac394a164';
  col_blau     CONSTANT UUID := 'fd5cb4f8-da3b-4d37-93a6-ddde9015ec43';
  col_weiss    CONSTANT UUID := '4ee3cafd-abeb-485b-8634-3fdbaabbf8c9';
  col_gruen    CONSTANT UUID := '175aa927-55ab-4405-962f-4ba5f260d181';
  col_grau     CONSTANT UUID := '49db7118-eb2b-4280-8dc7-d93e78f56c67';
  col_bordeaux CONSTANT UUID := '67a9e09b-eaf8-4ea3-b1cc-81112f7899e0';
  col_gold     CONSTANT UUID := 'ba9e66d9-a4e6-413c-a4fa-b3cd7d388d7c';
  col_creme    CONSTANT UUID := 'a2f4cc0b-2e9d-469a-807c-c99f74c5581d';
  col_beige    CONSTANT UUID := '4b24ade8-ff1b-49a9-bbf9-f52ae1bc4901';
  col_violett  CONSTANT UUID := '119eddb2-82f6-4eeb-bbd4-7ff50f66cafb';
  col_braun    CONSTANT UUID := '43ab3507-040b-45ba-86a4-5837fe2b8ea0';
  col_silber   CONSTANT UUID := '2daa1004-f96b-4e3d-a3c9-b230818e7c97';
  col_rosa     CONSTANT UUID := '8c46ce94-5e20-4de5-82e8-7a207c66bbfe';

  -- ── Taxonomy-IDs: Muster ─────────────────────────────────
  mu_uni      CONSTANT UUID := 'ed6270da-6055-4a13-8c78-35d602a873ff';
  mu_floral   CONSTANT UUID := 'c8dfae25-5a67-467f-a2f6-312734526232';
  mu_gestr    CONSTANT UUID := '221dd482-a6c6-47f4-a170-a517bb8f7a3d';
  mu_gemust   CONSTANT UUID := 'b160c5f0-1669-434c-8de7-51f6422f0e96';
  mu_kariert  CONSTANT UUID := 'ab0a97d8-4707-48fb-b7f6-9c18b6f94d5e';
  mu_bestickt CONSTANT UUID := 'ed02454b-55dc-4d0f-a90d-99d77a1c1f69';

  -- ── Taxonomy-IDs: Sparte ─────────────────────────────────
  sp_oper      CONSTANT UUID := '6df13a3a-b696-40da-94b9-4052bd7d631b';
  sp_schauspiel CONSTANT UUID := '09aef85a-2811-4ed4-977f-84ca78eff6b1';
  sp_musical   CONSTANT UUID := '726112a6-228a-45ea-86ea-ae1b9c12f23e';
  sp_ballett   CONSTANT UUID := '7661692e-8bf1-4970-8116-ae71269b2c77';

  -- ── Taxonomy-IDs: Reinigung / Pflege ─────────────────────
  w_hand     CONSTANT UUID := '202a91e5-bc62-43d1-b480-cb9f85e18a73';
  w_chemisch CONSTANT UUID := 'eb4d4a2c-44f0-41fe-acea-38d28c2a1759';
  d_nein     CONSTANT UUID := '77feb75f-0039-4176-8438-f27972782980';
  d_ja       CONSTANT UUID := '25fe1e5f-0f2d-4762-a86b-4164bd00e4fd';
  i_dampf    CONSTANT UUID := '24e2453f-b62d-425a-b02f-080e520e5251';
  i_ohne     CONSTANT UUID := 'ee73a481-851b-4185-8252-079d712c6fe4';

BEGIN

-- ════════════════════════════════════════════════════════════
-- STADTTHEATER BERN
-- ════════════════════════════════════════════════════════════

-- Bern 1: Roter Abendmantel
INSERT INTO costumes (theater_id, name, description, gender_term_id, clothing_type_id)
VALUES (th_bern,
  'Roter Abendmantel',
  'Taillierter Abendmantel aus schwerem Samt mit breitem Seidensatin-Revers und bodenlangem Schnitt. Innen vollständig mit rotem Seidenfutter ausgestattet. Getragen in La Traviata, Regie: Pina Koch.',
  g_damen, ct_mantel)
RETURNING id INTO c1;

INSERT INTO costume_items (costume_id, theater_id, barcode_id, size_label, current_status, condition_grade, is_public_for_rent, storage_location_path)
VALUES (c1, th_bern, 'BE-2023-001', '38', 'available', 4, true, '1.3.B');

INSERT INTO costume_taxonomy (costume_id, term_id) VALUES
  (c1, st_lang_mantel), (c1, m_samt),    (c1, m_seide),
  (c1, col_rot),        (c1, mu_uni),    (c1, sp_oper),
  (c1, w_chemisch),     (c1, d_nein),    (c1, i_dampf);

INSERT INTO costume_provenance (costume_id, production_title, year, season, role_name)
VALUES (c1, 'La Traviata', 2022, '2022/23', 'Violetta');


-- Bern 2: Weisses Ballkleid Empire
INSERT INTO costumes (theater_id, name, description, gender_term_id, clothing_type_id)
VALUES (th_bern,
  'Weisses Ballkleid Empire',
  'Hochzeitliches Ballkleid im Empire-Schnitt aus Seide und Tüll mit aufwendiger Spitzenborte am Ausschnitt und am Saum. Schleppe ca. 80 cm. Farbe: reinweiss mit Silberapplikationen.',
  g_damen, ct_ball)
RETURNING id INTO c2;

INSERT INTO costume_items (costume_id, theater_id, barcode_id, size_label, current_status, condition_grade, is_public_for_rent, storage_location_path)
VALUES (c2, th_bern, 'BE-2023-002', '36', 'available', 5, false, '1.1.A');

INSERT INTO costume_taxonomy (costume_id, term_id) VALUES
  (c2, st_empire),    (c2, m_seide),   (c2, m_tuell),
  (c2, m_spitze),     (c2, col_weiss), (c2, col_silber),
  (c2, mu_floral),    (c2, sp_oper),   (c2, w_chemisch),
  (c2, d_nein),       (c2, i_dampf);

INSERT INTO costume_provenance (costume_id, production_title, year, season, role_name)
VALUES (c2, 'Nozze di Figaro', 2023, '2023/24', 'Gräfin Almaviva');


-- Bern 3: Biedermeier-Herrenanzug
INSERT INTO costumes (theater_id, name, description, gender_term_id, clothing_type_id)
VALUES (th_bern,
  'Biedermeier-Herrenanzug',
  'Dreiteiliger Herrenanzug im Biedermeier-Stil (ca. 1820–1840): Gehrock aus kariertem Wollstoff in Beige-Braun, dazu passende Kniebundhose und Weste. Handgenähte Knöpfe aus Perlmutt.',
  g_herren, ct_anzug)
RETURNING id INTO c3;

INSERT INTO costume_items (costume_id, theater_id, barcode_id, size_label, current_status, condition_grade, is_public_for_rent, storage_location_path)
VALUES (c3, th_bern, 'BE-2023-003', '52', 'available', 3, true, '2.2.C');

INSERT INTO costume_taxonomy (costume_id, term_id) VALUES
  (c3, st_historisch), (c3, m_wolle),    (c3, m_baumwolle),
  (c3, col_braun),     (c3, col_beige),  (c3, mu_kariert),
  (c3, sp_schauspiel), (c3, w_chemisch), (c3, d_nein),
  (c3, i_dampf);

INSERT INTO costume_provenance (costume_id, production_title, year, season, role_name)
VALUES (c3, 'Der Alpenkönig', 2021, '2021/22', 'Rappelkopf');


-- ════════════════════════════════════════════════════════════
-- STADTTHEATER ZÜRICH
-- ════════════════════════════════════════════════════════════

-- Zürich 1: Militäruniform 19. Jahrhundert
INSERT INTO costumes (theater_id, name, description, gender_term_id, clothing_type_id)
VALUES (th_zuerich,
  'Militäruniform 19. Jahrhundert',
  'Preussische Offiziersuniform um 1870: Dunkelgraue Wolltunika mit Goldtresse und Schulterstücken, dazu Uniformhose mit Goldstreifen und Lederstiefel (nicht Teil des Kostüms). Alle Knöpfe vergoldet.',
  g_herren, ct_uniform)
RETURNING id INTO c4;

INSERT INTO costume_items (costume_id, theater_id, barcode_id, size_label, current_status, condition_grade, is_public_for_rent, storage_location_path)
VALUES (c4, th_zuerich, 'ZH-2023-001', '50', 'available', 4, true, '3.1.A');

INSERT INTO costume_taxonomy (costume_id, term_id) VALUES
  (c4, st_militaer),   (c4, m_wolle),   (c4, m_leder),
  (c4, col_grau),      (c4, col_gold),  (c4, mu_uni),
  (c4, sp_schauspiel), (c4, w_chemisch),(c4, d_nein),
  (c4, i_ohne);

INSERT INTO costume_provenance (costume_id, production_title, year, season, role_name)
VALUES (c4, 'Woyzeck', 2023, '2023/24', 'Hauptmann');


-- Zürich 2: Seidenes Abendkleid Bordeaux
INSERT INTO costumes (theater_id, name, description, gender_term_id, clothing_type_id)
VALUES (th_zuerich,
  'Seidenes Abendkleid Bordeaux',
  'Robe de Soirée aus schwerem Dupionisé-Seidenstoff in tiefem Bordeaux. Enganliegend geschnitten mit tiefem Rückenausschnitt und Schleppe. Goldene Paillettenstickerei am Ausschnitt.',
  g_damen, ct_abend)
RETURNING id INTO c5;

INSERT INTO costume_items (costume_id, theater_id, barcode_id, size_label, current_status, condition_grade, is_public_for_rent, storage_location_path)
VALUES (c5, th_zuerich, 'ZH-2023-002', '38', 'available', 5, false, '1.2.A');

INSERT INTO costume_taxonomy (costume_id, term_id) VALUES
  (c5, st_robe),     (c5, m_seide),   (c5, m_satin),
  (c5, col_bordeaux),(c5, col_gold),  (c5, mu_bestickt),
  (c5, sp_oper),     (c5, w_chemisch),(c5, d_nein),
  (c5, i_dampf);

INSERT INTO costume_provenance (costume_id, production_title, year, season, role_name)
VALUES (c5, 'Carmen', 2024, '2024/25', 'Carmen');


-- Zürich 3: Ballett-Tutu Klassisch
INSERT INTO costumes (theater_id, name, description, gender_term_id, clothing_type_id)
VALUES (th_zuerich,
  'Ballett-Tutu Klassisch',
  'Klassisches romantisches Tutu aus mehrlagigem Tüll in Weiss und Rosa. Oberteil aus Satin mit feiner Spitzenverzierung und handgenähten Perlenstickereien. 8 Lagen Tüll.',
  g_damen, ct_kleid)
RETURNING id INTO c6;

INSERT INTO costume_items (costume_id, theater_id, barcode_id, size_label, current_status, condition_grade, is_public_for_rent, storage_location_path)
VALUES (c6, th_zuerich, 'ZH-2023-003', '34', 'available', 4, false, '2.1.B');

INSERT INTO costume_taxonomy (costume_id, term_id) VALUES
  (c6, m_tuell),    (c6, m_satin),  (c6, m_spitze),
  (c6, col_weiss),  (c6, col_rosa), (c6, mu_uni),
  (c6, sp_ballett), (c6, w_hand),   (c6, d_nein),
  (c6, i_ohne);

INSERT INTO costume_provenance (costume_id, production_title, year, season, role_name)
VALUES (c6, 'Schwanensee', 2024, '2024/25', 'Odette');


-- ════════════════════════════════════════════════════════════
-- STADTTHEATER LUZERN
-- ════════════════════════════════════════════════════════════

-- Luzern 1: Rokoko-Kleid Goldgelb
INSERT INTO costumes (theater_id, name, description, gender_term_id, clothing_type_id)
VALUES (th_luzern,
  'Rokoko-Kleid Goldgelb',
  'Prachtvolles Rokoko-Ballkleid (ca. 1750) aus goldgelbem Brokatstoff mit Seidenunterfutter. Reifrock-Konstruktion, aufwendige Stickereien mit Goldlahn, Rüschenbesatz aus Tüll und Spitze. Gewicht ca. 4,2 kg.',
  g_damen, ct_ball)
RETURNING id INTO c7;

INSERT INTO costume_items (costume_id, theater_id, barcode_id, size_label, current_status, condition_grade, is_public_for_rent, storage_location_path)
VALUES (c7, th_luzern, 'LU-2023-001', '40', 'available', 4, false, '1.1.A');

INSERT INTO costume_taxonomy (costume_id, term_id) VALUES
  (c7, st_historisch),(c7, m_brokat),  (c7, m_seide),
  (c7, m_tuell),      (c7, m_spitze), (c7, col_gold),
  (c7, col_creme),    (c7, mu_bestickt),(c7, sp_oper),
  (c7, w_chemisch),   (c7, d_nein),   (c7, i_dampf);

INSERT INTO costume_provenance (costume_id, production_title, year, season, role_name)
VALUES (c7, 'Così fan tutte', 2023, '2023/24', 'Fiordiligi');


-- Luzern 2: Clown-Kostüm bunt
INSERT INTO costumes (theater_id, name, description, gender_term_id, clothing_type_id)
VALUES (th_luzern,
  'Clown-Kostüm bunt',
  'Zweiteiliges Clown-Kostüm aus buntem Polyester-Baumwollgemisch in Rot, Weiss und Blau. Weite Pumphose mit Hosenträgern, grosses Hemd mit Rüschenkragen. Inkl. grossen Knöpfen und Pompons.',
  g_unisex, ct_kostuem)
RETURNING id INTO c8;

INSERT INTO costume_items (costume_id, theater_id, barcode_id, size_label, current_status, condition_grade, is_public_for_rent, storage_location_path)
VALUES (c8, th_luzern, 'LU-2023-002', 'M / L', 'available', 3, true, '3.2.C');

INSERT INTO costume_taxonomy (costume_id, term_id) VALUES
  (c8, st_clown),      (c8, st_zweiteilig),(c8, m_polyester),
  (c8, m_baumwolle),   (c8, col_rot),      (c8, col_weiss),
  (c8, col_blau),      (c8, mu_gestr),     (c8, sp_schauspiel),
  (c8, w_hand),        (c8, d_ja),         (c8, i_ohne);

INSERT INTO costume_provenance (costume_id, production_title, year, season, role_name)
VALUES (c8, 'Der Besuch der alten Dame', 2022, '2022/23', 'Bote / Clown');


-- Luzern 3: Schwarzer Smoking
INSERT INTO costumes (theater_id, name, description, gender_term_id, clothing_type_id)
VALUES (th_luzern,
  'Schwarzer Smoking',
  'Klassischer Abend-Smoking aus feiner schwarzer Wolle mit Seidensatin-Revers (Schalkragen). Dazu: weisses Smokinghemd mit Plissee, schwarze Fliege. Zweiknopf-Jacke, schmale Hose mit Galon.',
  g_herren, ct_anzug)
RETURNING id INTO c9;

INSERT INTO costume_items (costume_id, theater_id, barcode_id, size_label, current_status, condition_grade, is_public_for_rent, storage_location_path)
VALUES (c9, th_luzern, 'LU-2023-003', '50', 'available', 5, true, '2.1.A');

INSERT INTO costume_taxonomy (costume_id, term_id) VALUES
  (c9, st_smoking),    (c9, m_wolle),    (c9, m_seide),
  (c9, col_schwarz),   (c9, col_weiss),  (c9, mu_uni),
  (c9, sp_musical),    (c9, w_chemisch), (c9, d_nein),
  (c9, i_dampf);

INSERT INTO costume_provenance (costume_id, production_title, year, season, role_name)
VALUES (c9, 'Chicago', 2024, '2024/25', 'Billy Flynn');


-- ════════════════════════════════════════════════════════════
-- THEATER OERLIKON
-- ════════════════════════════════════════════════════════════

-- Oerlikon 1: Viktorianisches Abendkleid
INSERT INTO costumes (theater_id, name, description, gender_term_id, clothing_type_id)
VALUES (th_oerlikon,
  'Viktorianisches Abendkleid',
  'Zweiteiliges Abendkleid der Spätviktorianik (ca. 1880): Tief-violetter Samtoberrock mit schwarzer Spitzenbluse. Tailliert mit Korsettschnitt, Stehkragen, lange Ärmel mit Spitzenmanschetten. Schleppe hinten.',
  g_damen, ct_abend)
RETURNING id INTO c10;

INSERT INTO costume_items (costume_id, theater_id, barcode_id, size_label, current_status, condition_grade, is_public_for_rent, storage_location_path)
VALUES (c10, th_oerlikon, 'OE-2023-001', '40', 'available', 4, true, '1.2.B');

INSERT INTO costume_taxonomy (costume_id, term_id) VALUES
  (c10, st_historisch), (c10, st_zweiteilig),(c10, m_samt),
  (c10, m_spitze),      (c10, col_violett),  (c10, col_schwarz),
  (c10, mu_bestickt),   (c10, sp_schauspiel),(c10, w_chemisch),
  (c10, d_nein),        (c10, i_dampf);

INSERT INTO costume_provenance (costume_id, production_title, year, season, role_name)
VALUES (c10, 'Hedda Gabler', 2023, '2023/24', 'Hedda Gabler');


-- Oerlikon 2: Sherlock Holmes Outfit
INSERT INTO costumes (theater_id, name, description, gender_term_id, clothing_type_id)
VALUES (th_oerlikon,
  'Sherlock Holmes Outfit',
  'Dreiteiliges Herrenoutfit im spätviktorianischen Stil: Karierter Wollanzug in Grau-Braun (Tweed-Optik), dazu passende Deerstalker-Mütze (beiliegend) und Krawatte. Jacket mit aufgesetzten Taschen.',
  g_herren, ct_anzug)
RETURNING id INTO c11;

INSERT INTO costume_items (costume_id, theater_id, barcode_id, size_label, current_status, condition_grade, is_public_for_rent, storage_location_path)
VALUES (c11, th_oerlikon, 'OE-2023-002', '52', 'available', 4, true, '2.3.A');

INSERT INTO costume_taxonomy (costume_id, term_id) VALUES
  (c11, st_historisch), (c11, m_wolle),    (c11, m_viskose),
  (c11, col_grau),      (c11, col_braun),  (c11, mu_kariert),
  (c11, sp_schauspiel), (c11, w_chemisch), (c11, d_nein),
  (c11, i_dampf);

INSERT INTO costume_provenance (costume_id, production_title, year, season, role_name)
VALUES (c11, 'Sherlock Holmes', 2024, '2024/25', 'Sherlock Holmes');


-- Oerlikon 3: Feenkleid Sommer
INSERT INTO costumes (theater_id, name, description, gender_term_id, clothing_type_id)
VALUES (th_oerlikon,
  'Feenkleid Sommer',
  'Leichtes Fantasiekleid für eine Feenfigur: mehrlagiger Organza in Grün und Weiss mit aufgenähten künstlichen Blüten und Schmetterlingen. Asymmetrischer Saum, Flügel-Applikationen an den Ärmeln.',
  g_damen, ct_kleid)
RETURNING id INTO c12;

INSERT INTO costume_items (costume_id, theater_id, barcode_id, size_label, current_status, condition_grade, is_public_for_rent, storage_location_path)
VALUES (c12, th_oerlikon, 'OE-2023-003', '36', 'available', 5, false, '1.1.C');

INSERT INTO costume_taxonomy (costume_id, term_id) VALUES
  (c12, st_fantasy),  (c12, m_organza), (c12, m_tuell),
  (c12, col_gruen),   (c12, col_weiss), (c12, mu_floral),
  (c12, sp_ballett),  (c12, w_hand),    (c12, d_nein),
  (c12, i_ohne);

INSERT INTO costume_provenance (costume_id, production_title, year, season, role_name)
VALUES (c12, 'Ein Sommernachtstraum', 2024, '2024/25', 'Titania');

END $$;
