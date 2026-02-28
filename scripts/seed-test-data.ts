/**
 * Seed script — populates Supabase with test data for development.
 * Run with: npx tsx scripts/seed-test-data.ts
 *
 * Uses the service_role key to bypass RLS.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_ACCESS_TOKEN!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Fixed UUIDs for test data (so script is idempotent)
const THEATER_1 = "aa000000-0000-0000-0000-000000000001";
const THEATER_2 = "aa000000-0000-0000-0000-000000000002";
const THEATER_3 = "aa000000-0000-0000-0000-000000000003";

async function main() {
  console.log("🎭 Seeding test data...\n");

  // ─── 1. Theaters ────────────────────────────────────────────────
  console.log("Creating theaters...");
  await supabase.from("theaters").upsert(
    [
      { id: THEATER_1, name: "Bühne Bern", slug: "buehne-bern", address_info: { street: "Kornhausplatz 20", city: "Bern", zip: "3011" }, settings: { allow_external_sharing: true } },
      { id: THEATER_2, name: "Schauspielhaus Zürich", slug: "schauspielhaus-zh", address_info: { street: "Rämistrasse 34", city: "Zürich", zip: "8001" }, settings: { allow_external_sharing: true } },
      { id: THEATER_3, name: "Theater Basel", slug: "theater-basel", address_info: { street: "Theaterstrasse 7", city: "Basel", zip: "4051" }, settings: { allow_external_sharing: true } },
    ],
    { onConflict: "id" }
  );

  // ─── 2. Look up taxonomy term IDs ──────────────────────────────
  console.log("Looking up taxonomy terms...");
  const { data: allTerms } = await supabase
    .from("taxonomy_terms")
    .select("id, vocabulary, label_de");

  if (!allTerms || allTerms.length === 0) {
    console.error("❌ No taxonomy terms found. Run migrations first.");
    process.exit(1);
  }

  const term = (vocab: string, label: string) => {
    const t = allTerms.find((t) => t.vocabulary === vocab && t.label_de === label);
    if (!t) console.warn(`⚠️  Term not found: ${vocab}/${label}`);
    return t?.id;
  };

  const genderDamen = term("gender", "Damen")!;
  const genderHerren = term("gender", "Herren")!;
  const genderKinder = term("gender", "Kinder")!;
  const genderUnisex = term("gender", "Unisex")!;

  const typeKleider = term("clothing_type", "Kleider")!;
  const typeAnzuege = term("clothing_type", "Anzüge")!;
  const typeHosen = term("clothing_type", "Hosen")!;
  const typeMaentel = term("clothing_type", "Mäntel & Jacken")!;
  const typeUniformen = term("clothing_type", "Uniformen")!;
  const typeKopf = term("clothing_type", "Kopfbedeckungen")!;

  const epochAntike = term("epoche", "Antike")!;
  const epochBarock = term("epoche", "Barock")!;
  const epochRokoko = term("epoche", "Rokoko")!;
  const epoch20er = term("epoche", "Zwanziger Jahre")!;
  const epochZeitgen = term("epoche", "Zeitgenössisch")!;

  const matSeide = term("material", "Seide")!;
  const matWolle = term("material", "Wolle")!;
  const matBaumwolle = term("material", "Baumwolle")!;
  const matSamt = term("material", "Samt")!;
  const matLeder = term("material", "Leder")!;

  const colorSchwarz = term("color", "Schwarz")!;
  const colorRot = term("color", "Rot")!;
  const colorGold = term("color", "Gold")!;
  const colorWeiss = term("color", "Weiss")!;
  const colorBlau = term("color", "Blau")!;

  const sparteFilm = term("sparte", "Film")!;
  const sparteOper = term("sparte", "Oper")!;
  const sparteSchauspiel = term("sparte", "Schauspiel")!;

  const musterUni = term("muster", "Uni")!;
  const musterFloral = term("muster", "Floral")!;
  const musterGestreift = term("muster", "Gestreift")!;

  // ─── 3. Costumes ───────────────────────────────────────────────
  console.log("Creating costumes...");

  const costumes = [
    {
      id: "cc000000-0000-0000-0000-000000000001",
      theater_id: THEATER_1, name: "Roter Ballkleid Traum",
      description: "Bodenlanges Ballkleid aus roter Seide mit Schleppe und aufwendiger Perlenstickerei am Oberteil. Getragen in der Premiere von 'La Traviata' am Stadttheater Bern.",
      gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false,
    },
    {
      id: "cc000000-0000-0000-0000-000000000002",
      theater_id: THEATER_1, name: "Schwarzer Dreiteiler Barock",
      description: "Eleganter Dreiteiler-Anzug im Barockstil mit Goldknöpfen und bestickter Weste. Samt-Stoff mit leichtem Schimmer.",
      gender_term_id: genderHerren, clothing_type_id: typeAnzuege, is_ensemble: true,
    },
    {
      id: "cc000000-0000-0000-0000-000000000003",
      theater_id: THEATER_2, name: "Militäruniform 1. Weltkrieg",
      description: "Originalgetreue Nachbildung einer Schweizer Militäruniform aus dem Ersten Weltkrieg. Feldgrauer Wollstoff, Messingknöpfe.",
      gender_term_id: genderHerren, clothing_type_id: typeUniformen, is_ensemble: false,
    },
    {
      id: "cc000000-0000-0000-0000-000000000004",
      theater_id: THEATER_1, name: "Rokoko Reifrock",
      description: "Opulenter Reifrock mit Blumenmuster und Spitzenbesatz. Perfekt für höfische Szenen. Umfangreiche Unterstruktur für authentische Silhouette.",
      gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false,
    },
    {
      id: "cc000000-0000-0000-0000-000000000005",
      theater_id: THEATER_2, name: "Lederjacke Zeitgenössisch",
      description: "Moderne schwarze Lederjacke im Used-Look. Ideal für zeitgenössische Inszenierungen.",
      gender_term_id: genderUnisex, clothing_type_id: typeMaentel, is_ensemble: false,
    },
    {
      id: "cc000000-0000-0000-0000-000000000006",
      theater_id: THEATER_3, name: "Goldene Abendgarderobe",
      description: "Goldschimmerndes Abendkleid mit Pailletten und tiefem Rückenausschnitt. Inspiriert von den Goldenen Zwanzigern.",
      gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false,
    },
    {
      id: "cc000000-0000-0000-0000-000000000007",
      theater_id: THEATER_1, name: "Matrosenhose Vintage",
      description: "Weite Matrosenhose aus schwerem Baumwollstoff. Hoher Bund mit Knopfleiste.",
      gender_term_id: genderHerren, clothing_type_id: typeHosen, is_ensemble: false,
    },
    {
      id: "cc000000-0000-0000-0000-000000000008",
      theater_id: THEATER_3, name: "Kinderkostüm Kleiner Prinz",
      description: "Komplettes Kostüm für 'Der Kleine Prinz': blauer Mantel mit Goldsternen, weisse Hose und roter Schal.",
      gender_term_id: genderKinder, clothing_type_id: typeMaentel, is_ensemble: true,
    },
    {
      id: "cc000000-0000-0000-0000-000000000009",
      theater_id: THEATER_2, name: "Zylinderhat Schwarz",
      description: "Klassischer schwarzer Zylinder aus Filz. Passend zu Frack oder Gehrock.",
      gender_term_id: genderHerren, clothing_type_id: typeKopf, is_ensemble: false,
    },
    {
      id: "cc000000-0000-0000-0000-000000000010",
      theater_id: THEATER_1, name: "Weisses Hochzeitskleid Biedermeier",
      description: "Aufwendig gearbeitetes Hochzeitskleid im Biedermeier-Stil mit Spitzenärmeln, hoher Taille und langer Schleppe.",
      gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false,
    },
  ];

  await supabase.from("costumes").upsert(costumes, { onConflict: "id" });

  // ─── 4. Ensemble children (for costume 2 — Dreiteiler) ────────
  console.log("Creating ensemble children...");
  await supabase.from("costumes").upsert(
    [
      { id: "cc000000-0000-0000-0000-000000000011", theater_id: THEATER_1, name: "Barockjacke mit Goldknöpfen", gender_term_id: genderHerren, clothing_type_id: typeMaentel, parent_costume_id: "cc000000-0000-0000-0000-000000000002" },
      { id: "cc000000-0000-0000-0000-000000000012", theater_id: THEATER_1, name: "Bestickte Weste Samt", gender_term_id: genderHerren, parent_costume_id: "cc000000-0000-0000-0000-000000000002" },
      { id: "cc000000-0000-0000-0000-000000000013", theater_id: THEATER_1, name: "Kniehose Barock Schwarz", gender_term_id: genderHerren, clothing_type_id: typeHosen, parent_costume_id: "cc000000-0000-0000-0000-000000000002" },
    ],
    { onConflict: "id" }
  );

  // ─── 5. Costume Items (physical pieces) ────────────────────────
  console.log("Creating costume items...");
  const items = costumes.map((c, i) => ({
    id: `bb000000-0000-0000-0000-00000000000${i + 1}`,
    costume_id: c.id,
    theater_id: c.theater_id,
    barcode_id: `KP-TEST${String(i + 1).padStart(4, "0")}`,
    size_label: ["S", "M", "L", "XL", "M", "S", "L", "128", "L", "S"][i],
    size_data: i % 3 === 0 ? { chest: 88 + i * 2, waist: 72 + i * 2, hip: 94 + i * 2, back_length: 40 + i, shoulder_width: 38 + i } : null,
    condition_grade: [5, 4, 3, 5, 4, 5, 3, 4, 5, 4][i],
    current_status: ["available", "available", "rented", "available", "available", "cleaning", "available", "available", "available", "available"][i] as string,
    storage_location_path: [
      "Bern.Stock1.Regal3.Box7",
      "Bern.Stock2.Regal1.Box2",
      "Zürich.Stock1.Regal5.Box12",
      "Bern.Stock1.Regal3.Box8",
      "Zürich.Stock2.Regal2.Box4",
      "Basel.Stock1.Regal1.Box1",
      "Bern.Stock2.Regal4.Box3",
      "Basel.Stock1.Regal2.Box6",
      "Zürich.Stock1.Regal1.Box1",
      "Bern.Stock1.Regal3.Box9",
    ][i],
    is_public_for_rent: true,
  }));

  await supabase.from("costume_items").upsert(items, { onConflict: "id" });

  // ─── 6. Provenance ────────────────────────────────────────────
  console.log("Creating provenance records...");
  await supabase.from("costume_provenance").upsert(
    [
      { id: "dd000000-0000-0000-0000-000000000001", costume_id: costumes[0].id, production_title: "La Traviata", year: 2024, actor_name: "Anna Meier", role_name: "Violetta", director_name: "Marco Rossi", costume_designer: "Lena Huber", costume_assistant: "Tim Bauer" },
      { id: "dd000000-0000-0000-0000-000000000002", costume_id: costumes[1].id, production_title: "Don Giovanni", year: 2023, actor_name: "Peter Müller", role_name: "Don Giovanni", director_name: "Sarah Koch", costume_designer: "Julia Meier" },
      { id: "dd000000-0000-0000-0000-000000000003", costume_id: costumes[2].id, production_title: "Hauptmann von Köpenick", year: 2022, role_name: "Hauptmann Voigt", director_name: "Thomas Lutz", costume_designer: "Eva Steiner" },
      { id: "dd000000-0000-0000-0000-000000000004", costume_id: costumes[3].id, production_title: "Marie Antoinette", year: 2024, actor_name: "Sophie Bauer", role_name: "Marie Antoinette", costume_designer: "Lena Huber" },
      { id: "dd000000-0000-0000-0000-000000000005", costume_id: costumes[4].id, production_title: "Trainspotting", year: 2025, role_name: "Renton", director_name: "Alex Grün" },
      { id: "dd000000-0000-0000-0000-000000000006", costume_id: costumes[5].id, production_title: "Cabaret", year: 2023, actor_name: "Maria Zimmermann", role_name: "Sally Bowles", director_name: "Fritz Weber", costume_designer: "Nina Kraft" },
      { id: "dd000000-0000-0000-0000-000000000007", costume_id: costumes[6].id, production_title: "Woyzeck", year: 2024, role_name: "Woyzeck", director_name: "Claudia Frey" },
      { id: "dd000000-0000-0000-0000-000000000008", costume_id: costumes[7].id, production_title: "Der Kleine Prinz", year: 2025, actor_name: "Liam Fischer", role_name: "Der Kleine Prinz", costume_designer: "Sabine Keller" },
      { id: "dd000000-0000-0000-0000-000000000009", costume_id: costumes[8].id, production_title: "A Christmas Carol", year: 2023, role_name: "Ebenezer Scrooge", director_name: "Hans Moser" },
      { id: "dd000000-0000-0000-0000-000000000010", costume_id: costumes[9].id, production_title: "Faust", year: 2024, actor_name: "Elena Richter", role_name: "Gretchen", director_name: "Karl Brunner", costume_designer: "Lena Huber" },
      // Second provenance for costume 0 (to show timeline)
      { id: "dd000000-0000-0000-0000-000000000011", costume_id: costumes[0].id, production_title: "Carmen", year: 2022, actor_name: "Clara Schmidt", role_name: "Carmen", director_name: "Paolo Bianchi" },
    ],
    { onConflict: "id" }
  );

  // ─── 7. Costume Taxonomy (many-to-many) ───────────────────────
  console.log("Linking taxonomy terms...");
  const taxonomyLinks = [
    // Costume 1: Roter Ballkleid — Oper, Barock, Seide, Rot, Uni
    { costume_id: costumes[0].id, term_id: sparteOper },
    { costume_id: costumes[0].id, term_id: epochBarock },
    { costume_id: costumes[0].id, term_id: matSeide },
    { costume_id: costumes[0].id, term_id: colorRot },
    { costume_id: costumes[0].id, term_id: musterUni },
    // Costume 2: Dreiteiler — Schauspiel, Barock, Samt, Schwarz+Gold
    { costume_id: costumes[1].id, term_id: sparteSchauspiel },
    { costume_id: costumes[1].id, term_id: epochBarock },
    { costume_id: costumes[1].id, term_id: matSamt },
    { costume_id: costumes[1].id, term_id: colorSchwarz },
    { costume_id: costumes[1].id, term_id: colorGold },
    // Costume 3: Militäruniform — Film, Zeitgenössisch, Wolle, Schwarz
    { costume_id: costumes[2].id, term_id: sparteFilm },
    { costume_id: costumes[2].id, term_id: epochZeitgen },
    { costume_id: costumes[2].id, term_id: matWolle },
    { costume_id: costumes[2].id, term_id: colorSchwarz },
    // Costume 4: Rokoko Reifrock — Oper, Rokoko, Seide, Weiss, Floral
    { costume_id: costumes[3].id, term_id: sparteOper },
    { costume_id: costumes[3].id, term_id: epochRokoko },
    { costume_id: costumes[3].id, term_id: matSeide },
    { costume_id: costumes[3].id, term_id: colorWeiss },
    { costume_id: costumes[3].id, term_id: musterFloral },
    // Costume 5: Lederjacke — Film, Zeitgenössisch, Leder, Schwarz
    { costume_id: costumes[4].id, term_id: sparteFilm },
    { costume_id: costumes[4].id, term_id: epochZeitgen },
    { costume_id: costumes[4].id, term_id: matLeder },
    { costume_id: costumes[4].id, term_id: colorSchwarz },
    // Costume 6: Goldene Abendgarderobe — Schauspiel, 20er, Seide, Gold
    { costume_id: costumes[5].id, term_id: sparteSchauspiel },
    { costume_id: costumes[5].id, term_id: epoch20er },
    { costume_id: costumes[5].id, term_id: matSeide },
    { costume_id: costumes[5].id, term_id: colorGold },
    // Costume 7: Matrosenhose — Schauspiel, Zeitgenössisch, Baumwolle, Blau, Gestreift
    { costume_id: costumes[6].id, term_id: sparteSchauspiel },
    { costume_id: costumes[6].id, term_id: epochZeitgen },
    { costume_id: costumes[6].id, term_id: matBaumwolle },
    { costume_id: costumes[6].id, term_id: colorBlau },
    { costume_id: costumes[6].id, term_id: musterGestreift },
    // Costume 8: Kinderkostüm — Schauspiel, Zeitgenössisch, Wolle, Blau+Gold
    { costume_id: costumes[7].id, term_id: sparteSchauspiel },
    { costume_id: costumes[7].id, term_id: epochZeitgen },
    { costume_id: costumes[7].id, term_id: matWolle },
    { costume_id: costumes[7].id, term_id: colorBlau },
    { costume_id: costumes[7].id, term_id: colorGold },
    // Costume 9: Zylinder — Schauspiel, Barock, Wolle, Schwarz
    { costume_id: costumes[8].id, term_id: sparteSchauspiel },
    { costume_id: costumes[8].id, term_id: epochBarock },
    { costume_id: costumes[8].id, term_id: matWolle },
    { costume_id: costumes[8].id, term_id: colorSchwarz },
    // Costume 10: Hochzeitskleid — Oper, Antike, Seide+Baumwolle, Weiss, Floral
    { costume_id: costumes[9].id, term_id: sparteOper },
    { costume_id: costumes[9].id, term_id: epochAntike },
    { costume_id: costumes[9].id, term_id: matSeide },
    { costume_id: costumes[9].id, term_id: matBaumwolle },
    { costume_id: costumes[9].id, term_id: colorWeiss },
    { costume_id: costumes[9].id, term_id: musterFloral },
  ].filter((l) => l.term_id); // skip any missing terms

  await supabase
    .from("costume_taxonomy")
    .upsert(taxonomyLinks, { onConflict: "costume_id,term_id" });

  // ─── 8. Events ────────────────────────────────────────────────
  console.log("Creating events...");
  await supabase.from("events").upsert(
    [
      {
        id: "ee000000-0000-0000-0000-000000000001",
        theater_id: THEATER_2,
        title: "Rampenverkauf Südpol Luzern",
        description: "Über 3'000 Kostüme, Accessoires und Requisiten aus dem Fundus des Südpol Luzern zu günstigen Preisen.",
        event_date: "2026-03-15",
        is_published: true,
      },
      {
        id: "ee000000-0000-0000-0000-000000000002",
        theater_id: THEATER_1,
        title: "Tag der offenen Tür — Fundus Bühne Bern",
        description: "Blick hinter die Kulissen: Besichtigung des Kostümfundus mit über 10'000 Stücken. Führungen stündlich.",
        event_date: "2026-04-20",
        is_published: true,
      },
    ],
    { onConflict: "id" }
  );

  console.log("\n✅ Test data seeded successfully!");
  console.log("   → 3 theaters (Bern, Zürich, Basel)");
  console.log("   → 10 costumes + 3 ensemble parts");
  console.log("   → 11 provenance records");
  console.log("   → 10 physical items with barcodes");
  console.log("   → ~50 taxonomy links (materials, colors, epochs, etc.)");
  console.log("   → 2 published events");
  console.log("\n💡 To view: log in and browse http://localhost:3000");
}

main().catch(console.error);
