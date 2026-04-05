/**
 * Extended seed script — adds 20 new costumes, 3 new theaters, taxonomy terms,
 * costume items, provenance, and taxonomy links.
 *
 * Run with: npx tsx scripts/seed-costumes-extended.ts
 *
 * Uses the service_role key to bypass RLS.
 * Requires SUPABASE_ACCESS_TOKEN (sbp_...) in environment.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ACCESS_TOKEN!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Existing theater IDs (do not overwrite)
const THEATER_1 = "aa000000-0000-0000-0000-000000000001"; // Bühne Bern
const THEATER_2 = "aa000000-0000-0000-0000-000000000002"; // Schauspielhaus Zürich
const THEATER_3 = "aa000000-0000-0000-0000-000000000003"; // Theater Basel

// New theater IDs
const THEATER_4 = "aa000000-0000-0000-0000-000000000004"; // Luzerner Theater
const THEATER_5 = "aa000000-0000-0000-0000-000000000005"; // SRF
const THEATER_6 = "aa000000-0000-0000-0000-000000000006"; // Opernhaus Zürich

async function main() {
  console.log("🎭 Seeding extended costume data...\n");

  // ─── 1. New Theaters ────────────────────────────────────────────────
  console.log("1/6 Creating new theaters...");
  const { error: theaterError } = await supabase.from("theaters").upsert([
    {
      id: THEATER_4,
      name: "Luzerner Theater",
      slug: "luzerner-theater",
      address_info: { street: "Theaterstrasse 2", city: "Luzern", zip: "6003" },
      settings: { allow_external_sharing: true },
    },
    {
      id: THEATER_5,
      name: "SRF",
      slug: "srf",
      address_info: { street: "Fernsehstrasse 1–4", city: "Zürich", zip: "8052" },
      settings: { allow_external_sharing: false },
    },
    {
      id: THEATER_6,
      name: "Opernhaus Zürich",
      slug: "opernhaus-zuerich",
      address_info: { street: "Falkenstrasse 1", city: "Zürich", zip: "8008" },
      settings: { allow_external_sharing: true },
    },
  ], { onConflict: "id" });
  if (theaterError) console.error("  ⚠️  Theaters:", theaterError.message);
  else console.log("  ✓ Theaters done");

  // ─── 2. New Taxonomy Terms ──────────────────────────────────────────
  console.log("2/6 Upserting taxonomy terms...");
  const { error: termError } = await supabase.from("taxonomy_terms").upsert([
    // Clothing types
    { vocabulary: "clothing_type", label_de: "Kostüme" },
    { vocabulary: "clothing_type", label_de: "Abendkleider" },
    { vocabulary: "clothing_type", label_de: "Ballkleider" },
    { vocabulary: "clothing_type", label_de: "Hochzeitskleider" },
    { vocabulary: "clothing_type", label_de: "Röcke" },
    // Epochen
    { vocabulary: "epoche", label_de: "Renaissance" },
    { vocabulary: "epoche", label_de: "Viktorianisch" },
    { vocabulary: "epoche", label_de: "Belle Époque" },
    { vocabulary: "epoche", label_de: "Dreissiger Jahre" },
    { vocabulary: "epoche", label_de: "Vierziger Jahre" },
    { vocabulary: "epoche", label_de: "Fünfziger Jahre" },
    { vocabulary: "epoche", label_de: "Fantastisch" },
    // Materialien
    { vocabulary: "material", label_de: "Tüll" },
    { vocabulary: "material", label_de: "Brokat" },
    { vocabulary: "material", label_de: "Taft" },
    { vocabulary: "material", label_de: "Satin" },
    { vocabulary: "material", label_de: "Spitze" },
    { vocabulary: "material", label_de: "Damast" },
    { vocabulary: "material", label_de: "Organza" },
    // Farben
    { vocabulary: "color", label_de: "Silber" },
    { vocabulary: "color", label_de: "Grün" },
    { vocabulary: "color", label_de: "Grau" },
    { vocabulary: "color", label_de: "Rosa" },
    { vocabulary: "color", label_de: "Violett" },
    { vocabulary: "color", label_de: "Creme" },
    // Sparten
    { vocabulary: "sparte", label_de: "Ballett" },
    { vocabulary: "sparte", label_de: "Fernsehen" },
    { vocabulary: "sparte", label_de: "Performance" },
    // Muster
    { vocabulary: "muster", label_de: "Ornamental" },
    { vocabulary: "muster", label_de: "Abstrakt" },
    { vocabulary: "muster", label_de: "Pünktchen" },
    { vocabulary: "muster", label_de: "Damast" },
  ], { onConflict: "vocabulary,label_de" });
  if (termError) console.error("  ⚠️  Terms:", termError.message);
  else console.log("  ✓ Taxonomy terms done");

  // ─── 3. Load all terms for lookups ─────────────────────────────────
  const { data: allTerms } = await supabase
    .from("taxonomy_terms")
    .select("id, vocabulary, label_de");

  if (!allTerms || allTerms.length === 0) {
    console.error("❌ No taxonomy terms found.");
    process.exit(1);
  }

  const term = (vocab: string, label: string): string | undefined => {
    const t = allTerms.find((t) => t.vocabulary === vocab && t.label_de === label);
    if (!t) console.warn(`  ⚠️  Term not found: ${vocab}/${label}`);
    return t?.id;
  };

  const genderDamen  = term("gender", "Damen")!;
  const genderUnisex = term("gender", "Unisex")!;
  const typeKleider  = term("clothing_type", "Kleider")!;
  const typeMaentel  = term("clothing_type", "Mäntel & Jacken")!;
  const typeKostueme = term("clothing_type", "Kostüme")!;
  const typeBall     = term("clothing_type", "Ballkleider")!;
  const typeAbend    = term("clothing_type", "Abendkleider")!;
  const typeHochzeit = term("clothing_type", "Hochzeitskleider")!;

  // ─── 4. New Costumes ────────────────────────────────────────────────
  console.log("3/6 Upserting costumes...");
  const { error: costumeError } = await supabase.from("costumes").upsert([
    { id: "cc000000-0000-0000-0000-000000000021", theater_id: THEATER_1, name: "Romantisches Schichtkleid Blaugrau/Rosa", description: "Zweiteiliges Kostüm: hellblaugrauer Gehrock mit Knopfleiste und Epauletten über einem rosé-weissen Rüschenrock mit Spitzenbesatz. Viktorianisch-romantischer Stil.", gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000022", theater_id: THEATER_4, name: "Barocker Schnürkorsett-Mantel Bronze/Gold", description: "Langer Taillenmantel aus bronzefarbenem Brokat mit goldenen Ornamentmotiven. Schnürung vorne, tailliert, ausgestellte Schösse.", gender_term_id: genderDamen, clothing_type_id: typeMaentel, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000023", theater_id: THEATER_4, name: "Barockes Hofkleid Gelbgrün/Gold", description: "Grosses Hofkleid aus Damastgewebe in Gelbgrün und Gold mit floralen Brokatmotiven, weissen Spitzenärmeln und goldener Gürtelgarnitur. Für Königinnendarstellungen.", gender_term_id: genderDamen, clothing_type_id: typeBall, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000024", theater_id: THEATER_5, name: "Fantasy Regenkleid Grün/Weiss", description: "Abstraktes Kostüm in Form eines Regenschauers. Grün-weisses Vichykaro-Kostüm mit aufgesetzten Regentropfen aus Stoff und einer Wolkenskulptur als Schulterpartie.", gender_term_id: genderUnisex, clothing_type_id: typeKostueme, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000025", theater_id: THEATER_3, name: "Viktorianisches Bolero-Jacket Royalblau", description: "Kurzes Bolero-Jacket aus königsblauem Samt mit Spitzenbesatz an Kragen, Schultern und Manschetten. Weisse Spitzenbluse darunter. Reich verziert mit Perlenschmuck.", gender_term_id: genderDamen, clothing_type_id: typeMaentel, is_ensemble: true },
    { id: "cc000000-0000-0000-0000-000000000026", theater_id: THEATER_4, name: "Barocker Gehrock Blau/Gold Brokat", description: "Taillenbetonter langer Gehrock aus blauem und goldfarbenem Brokat mit Blumenmotiven. Grossvolumige Satinschleife am Kragen, Satinbänder an Ärmeln, schwarzer Faltrock.", gender_term_id: genderDamen, clothing_type_id: typeMaentel, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000027", theater_id: THEATER_4, name: "Pierrot-Kostüm Rosa Tüll mit Harlekin-Strumpfhose", description: "Grossvolumiges Pierrot-Kostüm aus mehrlagigem rosa Tüll als Schulter-Cape-Kleid. Dazu schwarz-weisse Harlekin-Rauten-Strumpfhose. Für Clown-/Commedia-dell'arte-Darstellungen.", gender_term_id: genderUnisex, clothing_type_id: typeKostueme, is_ensemble: true },
    { id: "cc000000-0000-0000-0000-000000000028", theater_id: THEATER_6, name: "Rokoko-Ballkleid Gelb/Creme Marie-Antoinette-Stil", description: "Grosses Rokoko-Ballkleid aus gelbem Karostoff mit cremeweissen Rüschenbahnen und Schleifenverzierungen. Mintgrüne Schleife am Ausschnitt.", gender_term_id: genderDamen, clothing_type_id: typeBall, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000029", theater_id: THEATER_4, name: "Flapper-Kleid Schwarz mit Spitze", description: "Knielanges 1920er Abendkleid aus schwarzem Chiffon mit Spitzen-Oberteil, Pünktchen-Tüll und fein plissierten Lagen. Für Jazz-Age und Weimarer-Republik-Darstellungen.", gender_term_id: genderDamen, clothing_type_id: typeAbend, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000030", theater_id: THEATER_1, name: "Ballkleid Blaugrau Taft 50er-Jahre", description: "Tailliertes Abendkleid aus blaugrauem Taft mit weitem Stufenrock. Bootneck-Ausschnitt, Satinschleife am Bund. Typischer New-Look der 1950er Jahre.", gender_term_id: genderDamen, clothing_type_id: typeBall, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000031", theater_id: THEATER_6, name: "Cocktailkleid Weiss mit Perlen- und Kristallstickerei", description: "Kurzes Festkleid aus weissem Tüll mit vollflächiger Perl- und Kristallstickerei am Oberteil und feinem Blumenmuster im Rock.", gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000032", theater_id: THEATER_4, name: "Stufenballkleid Mintgrün mit Olivschärpe", description: "Schulterfreies Stufenballkleid aus mintgrünem Taft mit drei Volantlagen. Breite olivgrüne Samtschärpe am Bund. New-Look-Stil der 1950er Jahre.", gender_term_id: genderDamen, clothing_type_id: typeBall, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000033", theater_id: THEATER_6, name: "Off-Shoulder Cocktailkleid Silberblau", description: "Elegantes Off-Shoulder-Kleid aus silberblauem Dupion-Seidenstoff. Schulterübergreifende Draperie, seitliche Knopfleiste, weit schwingender Rock.", gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000034", theater_id: THEATER_1, name: "Abendkleid Creme mit Blumenstickerei", description: "Grosses Abendkleid aus cremefarbenem Satin mit vollflächiger Blumen- und Zweigstickerei in Violett und Grün. Herzausschnitt, tailliert, weit schwingender Rock.", gender_term_id: genderDamen, clothing_type_id: typeAbend, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000035", theater_id: THEATER_1, name: "Brautkleid Weiss Satin Modern", description: "Modernes Brautkleid aus weissem Satin mit tiefem V-Ausschnitt, Wickeloptik im Oberteil und langem Schlepprock. Minimalistisch-elegant, zeitloser Schnitt.", gender_term_id: genderDamen, clothing_type_id: typeHochzeit, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000036", theater_id: THEATER_1, name: "Marineblauer Taft Midirock mit Schleife", description: "Tailliertes Midi-Kleid aus marineblauen Taft mit Stehkragen, Schleife und Blütenbrosche. Weiter Schwingrock mit weissem Tüll-Unterkleid. Zeitgenössisch mit 50er-Einfluss.", gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000037", theater_id: THEATER_5, name: "Cremefarbenes Tüll-Drapéekleid mit Satinband", description: "Knielang-asymmetrisches Drapéekleid aus mehrlagigem cremefarbenen Tüll. Breites Satinband in Taupe als Bindegürtel. Zeitgenössisch, für Tanzproduktionen geeignet.", gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000038", theater_id: THEATER_5, name: "Avant-Garde Rüschen-Ensemble Grau-Silber", description: "Zweiteiliges Avant-Garde-Kostüm aus grau-silbernem Satin: Kurzjacke mit Puffärmeln und langer Rüschenrock aus gerafften Bahnen. Skulpturaler, performativer Charakter.", gender_term_id: genderUnisex, clothing_type_id: typeKostueme, is_ensemble: true },
    { id: "cc000000-0000-0000-0000-000000000039", theater_id: THEATER_1, name: "Violettes Taft-Kleid mit Blütenbrosche", description: "Tailliertes Midi-Kleid aus violettem Taft mit Stehkragen und Dreiviertelärmel. Hellblaue Blütenbrosche an der Brust. Zeitgenössisch mit 50er-Einfluss.", gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false },
    { id: "cc000000-0000-0000-0000-000000000040", theater_id: THEATER_4, name: "Barockes Hofkleid Silber-Grau mit Schleppe", description: "Grosses zweiteiliges Hofkleid aus silbergrauem Satin mit Brokatbesatz. Oberteil mit Brokat-Einlage, grosser Schlepprock, schwarze Handschuhe. Für Queen/Gräfinnen-Darstellungen.", gender_term_id: genderDamen, clothing_type_id: typeBall, is_ensemble: false },
  ], { onConflict: "id" });
  if (costumeError) console.error("  ⚠️  Costumes:", costumeError.message);
  else console.log("  ✓ Costumes done (20)");

  // ─── 5. Costume Items ───────────────────────────────────────────────
  console.log("4/6 Upserting costume items...");
  const { error: itemError } = await supabase.from("costume_items").upsert([
    { id: "bb000000-0000-0000-0000-000000000021", costume_id: "cc000000-0000-0000-0000-000000000021", theater_id: THEATER_1, barcode_id: "KP-LT0021", size_label: "36", size_data: { chest: 84, waist: 68, hip: 92, back_length: 130 }, condition_grade: 4, current_status: "available", storage_location_path: "Bern.Stock1.Regal4.Box12", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000022", costume_id: "cc000000-0000-0000-0000-000000000022", theater_id: THEATER_4, barcode_id: "KP-LT0022", size_label: "38", size_data: { chest: 88, waist: 70, hip: 96, back_length: 110 }, condition_grade: 4, current_status: "rented", storage_location_path: "Luzern.Stock1.Regal2.Box5", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000023", costume_id: "cc000000-0000-0000-0000-000000000023", theater_id: THEATER_4, barcode_id: "KP-LT0023", size_label: "40", size_data: { chest: 92, waist: 74, hip: 98, back_length: 160 }, condition_grade: 5, current_status: "available", storage_location_path: "Luzern.Stock1.Regal1.Box1", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000024", costume_id: "cc000000-0000-0000-0000-000000000024", theater_id: THEATER_5, barcode_id: "KP-SRF001", size_label: "Einheitsgrösse", size_data: { chest: 90, waist: null, hip: null, back_length: 80 }, condition_grade: 5, current_status: "available", storage_location_path: "SRF.Stock2.Regal6.Box3", is_public_for_rent: false },
    { id: "bb000000-0000-0000-0000-000000000025", costume_id: "cc000000-0000-0000-0000-000000000025", theater_id: THEATER_3, barcode_id: "KP-BS0025", size_label: "36", size_data: { chest: 84, waist: 66, hip: null, back_length: 55 }, condition_grade: 3, current_status: "cleaning", storage_location_path: "Basel.Stock1.Regal3.Box9", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000026", costume_id: "cc000000-0000-0000-0000-000000000026", theater_id: THEATER_4, barcode_id: "KP-LT0026", size_label: "38", size_data: { chest: 88, waist: 72, hip: 94, back_length: 115 }, condition_grade: 5, current_status: "available", storage_location_path: "Luzern.Stock1.Regal2.Box7", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000027", costume_id: "cc000000-0000-0000-0000-000000000027", theater_id: THEATER_4, barcode_id: "KP-LT0027", size_label: "S/M", size_data: { chest: 86, waist: 68, hip: 90, back_length: 90 }, condition_grade: 4, current_status: "available", storage_location_path: "Luzern.Stock2.Regal5.Box2", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000028", costume_id: "cc000000-0000-0000-0000-000000000028", theater_id: THEATER_6, barcode_id: "KP-OHZ001", size_label: "36", size_data: { chest: 84, waist: 64, hip: 90, back_length: 175 }, condition_grade: 5, current_status: "available", storage_location_path: "Zuerich.Stock1.Regal1.Box1", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000029", costume_id: "cc000000-0000-0000-0000-000000000029", theater_id: THEATER_4, barcode_id: "KP-LT0029", size_label: "34", size_data: { chest: 82, waist: 65, hip: 88, back_length: 95 }, condition_grade: 4, current_status: "available", storage_location_path: "Luzern.Stock2.Regal3.Box11", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000030", costume_id: "cc000000-0000-0000-0000-000000000030", theater_id: THEATER_1, barcode_id: "KP-LT0030", size_label: "36", size_data: { chest: 84, waist: 64, hip: 90, back_length: 130 }, condition_grade: 5, current_status: "available", storage_location_path: "Bern.Stock1.Regal4.Box5", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000031", costume_id: "cc000000-0000-0000-0000-000000000031", theater_id: THEATER_6, barcode_id: "KP-OHZ002", size_label: "34", size_data: { chest: 80, waist: 62, hip: 86, back_length: 85 }, condition_grade: 5, current_status: "in_repair", storage_location_path: "Zuerich.Stock1.Regal2.Box4", is_public_for_rent: false },
    { id: "bb000000-0000-0000-0000-000000000032", costume_id: "cc000000-0000-0000-0000-000000000032", theater_id: THEATER_4, barcode_id: "KP-LT0032", size_label: "38", size_data: { chest: 88, waist: 70, hip: 96, back_length: 100 }, condition_grade: 4, current_status: "available", storage_location_path: "Luzern.Stock1.Regal3.Box6", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000033", costume_id: "cc000000-0000-0000-0000-000000000033", theater_id: THEATER_6, barcode_id: "KP-OHZ003", size_label: "36", size_data: { chest: 84, waist: 66, hip: 90, back_length: 95 }, condition_grade: 5, current_status: "available", storage_location_path: "Zuerich.Stock1.Regal1.Box3", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000034", costume_id: "cc000000-0000-0000-0000-000000000034", theater_id: THEATER_1, barcode_id: "KP-BE0034", size_label: "38", size_data: { chest: 88, waist: 68, hip: 94, back_length: 155 }, condition_grade: 4, current_status: "available", storage_location_path: "Bern.Stock2.Regal1.Box8", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000035", costume_id: "cc000000-0000-0000-0000-000000000035", theater_id: THEATER_1, barcode_id: "KP-BE0035", size_label: "36", size_data: { chest: 84, waist: 66, hip: 90, back_length: 185 }, condition_grade: 5, current_status: "available", storage_location_path: "Bern.Stock1.Regal5.Box2", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000036", costume_id: "cc000000-0000-0000-0000-000000000036", theater_id: THEATER_1, barcode_id: "KP-BE0036", size_label: "44", size_data: { chest: 96, waist: 80, hip: 104, back_length: 120 }, condition_grade: 5, current_status: "available", storage_location_path: "Bern.Stock2.Regal2.Box3", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000037", costume_id: "cc000000-0000-0000-0000-000000000037", theater_id: THEATER_5, barcode_id: "KP-SRF002", size_label: "36", size_data: { chest: 84, waist: 66, hip: 90, back_length: 90 }, condition_grade: 4, current_status: "available", storage_location_path: "SRF.Stock1.Regal4.Box7", is_public_for_rent: false },
    { id: "bb000000-0000-0000-0000-000000000038", costume_id: "cc000000-0000-0000-0000-000000000038", theater_id: THEATER_5, barcode_id: "KP-SRF003", size_label: "S/M", size_data: { chest: 88, waist: null, hip: null, back_length: 100 }, condition_grade: 4, current_status: "in_repair", storage_location_path: "SRF.Stock1.Regal4.Box8", is_public_for_rent: false },
    { id: "bb000000-0000-0000-0000-000000000039", costume_id: "cc000000-0000-0000-0000-000000000039", theater_id: THEATER_1, barcode_id: "KP-BE0039", size_label: "46", size_data: { chest: 100, waist: 84, hip: 108, back_length: 118 }, condition_grade: 5, current_status: "available", storage_location_path: "Bern.Stock2.Regal3.Box1", is_public_for_rent: true },
    { id: "bb000000-0000-0000-0000-000000000040", costume_id: "cc000000-0000-0000-0000-000000000040", theater_id: THEATER_4, barcode_id: "KP-LT0040", size_label: "36", size_data: { chest: 84, waist: 66, hip: 92, back_length: 195 }, condition_grade: 4, current_status: "rented", storage_location_path: "Luzern.Stock1.Regal1.Box2", is_public_for_rent: true },
  ], { onConflict: "id" });
  if (itemError) console.error("  ⚠️  Items:", itemError.message);
  else console.log("  ✓ Costume items done (20)");

  // ─── 6. Provenance ──────────────────────────────────────────────────
  console.log("5/6 Upserting provenance...");
  const { error: provError } = await supabase.from("costume_provenance").upsert([
    { id: "dd000000-0000-0000-0000-000000000021", costume_id: "cc000000-0000-0000-0000-000000000021", production_title: "Dornröschen", year: 2024, role_name: "Dornröschen", director_name: "Hans Küng", costume_designer: "Sabine Sieber", costume_assistant: "Peter Hauser" },
    { id: "dd000000-0000-0000-0000-000000000022", costume_id: "cc000000-0000-0000-0000-000000000022", production_title: "Tosca", year: 2025, actor_name: "Manon Adrianow", role_name: "Tosca", director_name: "Teresa Rotemberg", costume_designer: "Klara Behr", costume_assistant: "Alma Assistentin" },
    { id: "dd000000-0000-0000-0000-000000000023", costume_id: "cc000000-0000-0000-0000-000000000023", production_title: "Figaro", year: 2024, actor_name: "Elena Richter", role_name: "Gräfin Almaviva", director_name: "Teresa Rotemberg", costume_designer: "Klara Behr", costume_assistant: "Alma Assistentin" },
    { id: "dd000000-0000-0000-0000-000000000024", costume_id: "cc000000-0000-0000-0000-000000000024", production_title: "Exploration of Energy", year: 2025, role_name: "Regen-Figur", director_name: "Lisa Meier", costume_designer: "Lena Hofmann" },
    { id: "dd000000-0000-0000-0000-000000000025", costume_id: "cc000000-0000-0000-0000-000000000025", production_title: "Carmen", year: 2023, role_name: "Mercedes", director_name: "Anna Wolf", costume_designer: "Marc Frei" },
    { id: "dd000000-0000-0000-0000-000000000026", costume_id: "cc000000-0000-0000-0000-000000000026", production_title: "Tosca", year: 2025, actor_name: "Sabine Sieber", role_name: "Marchesa Attavanti", director_name: "Teresa Rotemberg", costume_designer: "Klara Behr" },
    { id: "dd000000-0000-0000-0000-000000000027", costume_id: "cc000000-0000-0000-0000-000000000027", production_title: "Woyzeck", year: 2024, role_name: "Pierrot", director_name: "Claudia Frey", costume_designer: "Klara Behr" },
    { id: "dd000000-0000-0000-0000-000000000028", costume_id: "cc000000-0000-0000-0000-000000000028", production_title: "Der Rosenkavalier", year: 2024, actor_name: "Sophie Bauer", role_name: "Marschallin", director_name: "Marc Frei", costume_designer: "Marc Frei" },
    { id: "dd000000-0000-0000-0000-000000000029", costume_id: "cc000000-0000-0000-0000-000000000029", production_title: "Figaro", year: 2023, role_name: "Barbarina", director_name: "Teresa Rotemberg", costume_designer: "Klara Behr", costume_assistant: "Alma Assistentin" },
    { id: "dd000000-0000-0000-0000-000000000030", costume_id: "cc000000-0000-0000-0000-000000000030", production_title: "Dornröschen", year: 2024, actor_name: "Manon Adrianow", role_name: "Fee", director_name: "Hans Küng", costume_designer: "Sabine Sieber" },
    { id: "dd000000-0000-0000-0000-000000000031", costume_id: "cc000000-0000-0000-0000-000000000031", production_title: "Der Rosenkavalier", year: 2024, role_name: "Sophie", director_name: "Marc Frei", costume_designer: "Marc Frei" },
    { id: "dd000000-0000-0000-0000-000000000032", costume_id: "cc000000-0000-0000-0000-000000000032", production_title: "Figaro", year: 2025, actor_name: "Clara Schmidt", role_name: "Susanna", director_name: "Teresa Rotemberg", costume_designer: "Klara Behr", costume_assistant: "Alma Assistentin" },
    { id: "dd000000-0000-0000-0000-000000000033", costume_id: "cc000000-0000-0000-0000-000000000033", production_title: "Der Rosenkavalier", year: 2023, actor_name: "Anna Meier", role_name: "Octavian", director_name: "Marc Frei", costume_designer: "Marc Frei" },
    { id: "dd000000-0000-0000-0000-000000000034", costume_id: "cc000000-0000-0000-0000-000000000034", production_title: "Die Eisbärin", year: 2025, actor_name: "Maria Zimmermann", role_name: "Eisbärin", director_name: "Hans Küng", costume_designer: "Sabine Sieber", costume_assistant: "Peter Hauser" },
    { id: "dd000000-0000-0000-0000-000000000035", costume_id: "cc000000-0000-0000-0000-000000000035", production_title: "Die Eisbärin", year: 2025, role_name: "Braut", director_name: "Hans Küng", costume_designer: "Sabine Sieber" },
    { id: "dd000000-0000-0000-0000-000000000036", costume_id: "cc000000-0000-0000-0000-000000000036", production_title: "Die Eisbärin", year: 2025, actor_name: "Lena Fischer", role_name: "Schwester", director_name: "Hans Küng", costume_designer: "Sabine Sieber" },
    { id: "dd000000-0000-0000-0000-000000000037", costume_id: "cc000000-0000-0000-0000-000000000037", production_title: "Exploration of Energy", year: 2025, role_name: "Luft-Figur", director_name: "Lisa Meier", costume_designer: "Lena Hofmann" },
    { id: "dd000000-0000-0000-0000-000000000038", costume_id: "cc000000-0000-0000-0000-000000000038", production_title: "Exploration of Energy", year: 2025, role_name: "Metall-Figur", director_name: "Lisa Meier", costume_designer: "Lena Hofmann" },
    { id: "dd000000-0000-0000-0000-000000000039", costume_id: "cc000000-0000-0000-0000-000000000039", production_title: "Die Eisbärin", year: 2025, actor_name: "Peter Hauser", role_name: "Mutter", director_name: "Hans Küng", costume_designer: "Sabine Sieber" },
    { id: "dd000000-0000-0000-0000-000000000040", costume_id: "cc000000-0000-0000-0000-000000000040", production_title: "Tosca", year: 2024, actor_name: "Manon Adrianow", role_name: "Königin", director_name: "Teresa Rotemberg", costume_designer: "Klara Behr", costume_assistant: "Alma Assistentin" },
  ], { onConflict: "id" });
  if (provError) console.error("  ⚠️  Provenance:", provError.message);
  else console.log("  ✓ Provenance done (20)");

  // ─── 7. Taxonomy Links ──────────────────────────────────────────────
  console.log("6/6 Upserting taxonomy links...");

  const epochViktor   = term("epoche", "Viktorianisch")!;
  const epochBarock   = term("epoche", "Barock")!;
  const epochRokoko   = term("epoche", "Rokoko")!;
  const epoch20er     = term("epoche", "Zwanziger Jahre")!;
  const epoch50er     = term("epoche", "Fünfziger Jahre")!;
  const epochZeitgen  = term("epoche", "Zeitgenössisch")!;
  const epochFantasy  = term("epoche", "Fantastisch")!;
  const matSeide      = term("material", "Seide")!;
  const matSamt       = term("material", "Samt")!;
  const matBrokat     = term("material", "Brokat")!;
  const matTuell      = term("material", "Tüll")!;
  const matTaft       = term("material", "Taft")!;
  const matSatin      = term("material", "Satin")!;
  const matSpitze     = term("material", "Spitze")!;
  const matBaumw      = term("material", "Baumwolle")!;
  const colorSchwarz  = term("color", "Schwarz")!;
  const colorWeiss    = term("color", "Weiss")!;
  const colorGold     = term("color", "Gold")!;
  const colorBlau     = term("color", "Blau")!;
  const colorSilber   = term("color", "Silber")!;
  const colorGruen    = term("color", "Grün")!;
  const colorGrau     = term("color", "Grau")!;
  const colorRosa     = term("color", "Rosa")!;
  const colorViolett  = term("color", "Violett")!;
  const colorCreme    = term("color", "Creme")!;
  const sparteOper    = term("sparte", "Oper")!;
  const sparteSchausp = term("sparte", "Schauspiel")!;
  const sparteBallett = term("sparte", "Ballett")!;
  const sparteFernseh = term("sparte", "Fernsehen")!;
  const spartePerform = term("sparte", "Performance")!;
  const musterUni     = term("muster", "Uni")!;
  const musterFloral  = term("muster", "Floral")!;
  const musterKariert = term("muster", "Kariert")!;
  const musterOrnament= term("muster", "Ornamental")!;
  const musterAbstrakt= term("muster", "Abstrakt")!;
  const musterDamast  = term("muster", "Damast")!;

  const links = [
    // 21 — Schichtkleid Blaugrau/Rosa
    { costume_id: "cc000000-0000-0000-0000-000000000021", term_id: epochViktor },
    { costume_id: "cc000000-0000-0000-0000-000000000021", term_id: sparteSchausp },
    { costume_id: "cc000000-0000-0000-0000-000000000021", term_id: matSpitze },
    { costume_id: "cc000000-0000-0000-0000-000000000021", term_id: colorRosa },
    { costume_id: "cc000000-0000-0000-0000-000000000021", term_id: musterUni },
    // 22 — Korsett-Mantel Bronze/Gold
    { costume_id: "cc000000-0000-0000-0000-000000000022", term_id: epochBarock },
    { costume_id: "cc000000-0000-0000-0000-000000000022", term_id: sparteOper },
    { costume_id: "cc000000-0000-0000-0000-000000000022", term_id: matBrokat },
    { costume_id: "cc000000-0000-0000-0000-000000000022", term_id: matSatin },
    { costume_id: "cc000000-0000-0000-0000-000000000022", term_id: colorGold },
    { costume_id: "cc000000-0000-0000-0000-000000000022", term_id: musterOrnament },
    // 23 — Hofkleid Gelbgrün/Gold
    { costume_id: "cc000000-0000-0000-0000-000000000023", term_id: epochBarock },
    { costume_id: "cc000000-0000-0000-0000-000000000023", term_id: sparteOper },
    { costume_id: "cc000000-0000-0000-0000-000000000023", term_id: matBrokat },
    { costume_id: "cc000000-0000-0000-0000-000000000023", term_id: matSpitze },
    { costume_id: "cc000000-0000-0000-0000-000000000023", term_id: colorGold },
    { costume_id: "cc000000-0000-0000-0000-000000000023", term_id: colorGruen },
    { costume_id: "cc000000-0000-0000-0000-000000000023", term_id: musterDamast },
    // 24 — Fantasy Regenkleid
    { costume_id: "cc000000-0000-0000-0000-000000000024", term_id: epochFantasy },
    { costume_id: "cc000000-0000-0000-0000-000000000024", term_id: sparteFernseh },
    { costume_id: "cc000000-0000-0000-0000-000000000024", term_id: matBaumw },
    { costume_id: "cc000000-0000-0000-0000-000000000024", term_id: colorGruen },
    { costume_id: "cc000000-0000-0000-0000-000000000024", term_id: colorWeiss },
    { costume_id: "cc000000-0000-0000-0000-000000000024", term_id: musterKariert },
    // 25 — Bolero-Jacket Royalblau
    { costume_id: "cc000000-0000-0000-0000-000000000025", term_id: epochViktor },
    { costume_id: "cc000000-0000-0000-0000-000000000025", term_id: sparteOper },
    { costume_id: "cc000000-0000-0000-0000-000000000025", term_id: matSamt },
    { costume_id: "cc000000-0000-0000-0000-000000000025", term_id: matSpitze },
    { costume_id: "cc000000-0000-0000-0000-000000000025", term_id: colorBlau },
    // 26 — Barocker Gehrock Blau/Gold
    { costume_id: "cc000000-0000-0000-0000-000000000026", term_id: epochBarock },
    { costume_id: "cc000000-0000-0000-0000-000000000026", term_id: sparteOper },
    { costume_id: "cc000000-0000-0000-0000-000000000026", term_id: matBrokat },
    { costume_id: "cc000000-0000-0000-0000-000000000026", term_id: matSatin },
    { costume_id: "cc000000-0000-0000-0000-000000000026", term_id: colorBlau },
    { costume_id: "cc000000-0000-0000-0000-000000000026", term_id: colorGold },
    { costume_id: "cc000000-0000-0000-0000-000000000026", term_id: musterOrnament },
    // 27 — Pierrot Rosa Tüll
    { costume_id: "cc000000-0000-0000-0000-000000000027", term_id: epochFantasy },
    { costume_id: "cc000000-0000-0000-0000-000000000027", term_id: sparteSchausp },
    { costume_id: "cc000000-0000-0000-0000-000000000027", term_id: matTuell },
    { costume_id: "cc000000-0000-0000-0000-000000000027", term_id: colorRosa },
    { costume_id: "cc000000-0000-0000-0000-000000000027", term_id: colorSchwarz },
    { costume_id: "cc000000-0000-0000-0000-000000000027", term_id: musterAbstrakt },
    // 28 — Rokoko Ballkleid
    { costume_id: "cc000000-0000-0000-0000-000000000028", term_id: epochRokoko },
    { costume_id: "cc000000-0000-0000-0000-000000000028", term_id: sparteOper },
    { costume_id: "cc000000-0000-0000-0000-000000000028", term_id: matTaft },
    { costume_id: "cc000000-0000-0000-0000-000000000028", term_id: matSpitze },
    { costume_id: "cc000000-0000-0000-0000-000000000028", term_id: colorGold },
    { costume_id: "cc000000-0000-0000-0000-000000000028", term_id: colorCreme },
    { costume_id: "cc000000-0000-0000-0000-000000000028", term_id: musterFloral },
    // 29 — Flapper-Kleid Schwarz
    { costume_id: "cc000000-0000-0000-0000-000000000029", term_id: epoch20er },
    { costume_id: "cc000000-0000-0000-0000-000000000029", term_id: sparteSchausp },
    { costume_id: "cc000000-0000-0000-0000-000000000029", term_id: matSpitze },
    { costume_id: "cc000000-0000-0000-0000-000000000029", term_id: matTuell },
    { costume_id: "cc000000-0000-0000-0000-000000000029", term_id: colorSchwarz },
    // 30 — Ballkleid Blaugrau 50er
    { costume_id: "cc000000-0000-0000-0000-000000000030", term_id: epoch50er },
    { costume_id: "cc000000-0000-0000-0000-000000000030", term_id: sparteBallett },
    { costume_id: "cc000000-0000-0000-0000-000000000030", term_id: matTaft },
    { costume_id: "cc000000-0000-0000-0000-000000000030", term_id: colorBlau },
    { costume_id: "cc000000-0000-0000-0000-000000000030", term_id: colorGrau },
    { costume_id: "cc000000-0000-0000-0000-000000000030", term_id: musterUni },
    // 31 — Cocktailkleid Perlen
    { costume_id: "cc000000-0000-0000-0000-000000000031", term_id: epoch50er },
    { costume_id: "cc000000-0000-0000-0000-000000000031", term_id: sparteOper },
    { costume_id: "cc000000-0000-0000-0000-000000000031", term_id: matTuell },
    { costume_id: "cc000000-0000-0000-0000-000000000031", term_id: colorWeiss },
    { costume_id: "cc000000-0000-0000-0000-000000000031", term_id: colorSilber },
    { costume_id: "cc000000-0000-0000-0000-000000000031", term_id: musterFloral },
    // 32 — Stufenballkleid Mintgrün
    { costume_id: "cc000000-0000-0000-0000-000000000032", term_id: epoch50er },
    { costume_id: "cc000000-0000-0000-0000-000000000032", term_id: sparteOper },
    { costume_id: "cc000000-0000-0000-0000-000000000032", term_id: matTaft },
    { costume_id: "cc000000-0000-0000-0000-000000000032", term_id: colorGruen },
    { costume_id: "cc000000-0000-0000-0000-000000000032", term_id: musterUni },
    // 33 — Off-Shoulder Silberblau
    { costume_id: "cc000000-0000-0000-0000-000000000033", term_id: epoch50er },
    { costume_id: "cc000000-0000-0000-0000-000000000033", term_id: sparteOper },
    { costume_id: "cc000000-0000-0000-0000-000000000033", term_id: matSeide },
    { costume_id: "cc000000-0000-0000-0000-000000000033", term_id: colorBlau },
    { costume_id: "cc000000-0000-0000-0000-000000000033", term_id: colorSilber },
    { costume_id: "cc000000-0000-0000-0000-000000000033", term_id: musterUni },
    // 34 — Abendkleid Creme Stickerei
    { costume_id: "cc000000-0000-0000-0000-000000000034", term_id: epoch50er },
    { costume_id: "cc000000-0000-0000-0000-000000000034", term_id: sparteSchausp },
    { costume_id: "cc000000-0000-0000-0000-000000000034", term_id: matSatin },
    { costume_id: "cc000000-0000-0000-0000-000000000034", term_id: colorCreme },
    { costume_id: "cc000000-0000-0000-0000-000000000034", term_id: colorViolett },
    { costume_id: "cc000000-0000-0000-0000-000000000034", term_id: musterFloral },
    // 35 — Brautkleid Satin
    { costume_id: "cc000000-0000-0000-0000-000000000035", term_id: epochZeitgen },
    { costume_id: "cc000000-0000-0000-0000-000000000035", term_id: sparteSchausp },
    { costume_id: "cc000000-0000-0000-0000-000000000035", term_id: matSatin },
    { costume_id: "cc000000-0000-0000-0000-000000000035", term_id: colorWeiss },
    { costume_id: "cc000000-0000-0000-0000-000000000035", term_id: musterUni },
    // 36 — Marineblauer Taft Midirock
    { costume_id: "cc000000-0000-0000-0000-000000000036", term_id: epoch50er },
    { costume_id: "cc000000-0000-0000-0000-000000000036", term_id: sparteSchausp },
    { costume_id: "cc000000-0000-0000-0000-000000000036", term_id: matTaft },
    { costume_id: "cc000000-0000-0000-0000-000000000036", term_id: matTuell },
    { costume_id: "cc000000-0000-0000-0000-000000000036", term_id: colorBlau },
    { costume_id: "cc000000-0000-0000-0000-000000000036", term_id: musterUni },
    // 37 — Tüll-Drapéekleid Creme
    { costume_id: "cc000000-0000-0000-0000-000000000037", term_id: epochZeitgen },
    { costume_id: "cc000000-0000-0000-0000-000000000037", term_id: sparteFernseh },
    { costume_id: "cc000000-0000-0000-0000-000000000037", term_id: matTuell },
    { costume_id: "cc000000-0000-0000-0000-000000000037", term_id: matSatin },
    { costume_id: "cc000000-0000-0000-0000-000000000037", term_id: colorCreme },
    { costume_id: "cc000000-0000-0000-0000-000000000037", term_id: musterUni },
    // 38 — Avant-Garde Grau/Silber
    { costume_id: "cc000000-0000-0000-0000-000000000038", term_id: epochZeitgen },
    { costume_id: "cc000000-0000-0000-0000-000000000038", term_id: spartePerform },
    { costume_id: "cc000000-0000-0000-0000-000000000038", term_id: matSatin },
    { costume_id: "cc000000-0000-0000-0000-000000000038", term_id: colorGrau },
    { costume_id: "cc000000-0000-0000-0000-000000000038", term_id: colorSilber },
    { costume_id: "cc000000-0000-0000-0000-000000000038", term_id: musterAbstrakt },
    // 39 — Violettes Taft-Kleid
    { costume_id: "cc000000-0000-0000-0000-000000000039", term_id: epoch50er },
    { costume_id: "cc000000-0000-0000-0000-000000000039", term_id: sparteSchausp },
    { costume_id: "cc000000-0000-0000-0000-000000000039", term_id: matTaft },
    { costume_id: "cc000000-0000-0000-0000-000000000039", term_id: colorViolett },
    { costume_id: "cc000000-0000-0000-0000-000000000039", term_id: musterUni },
    // 40 — Hofkleid Silber-Grau
    { costume_id: "cc000000-0000-0000-0000-000000000040", term_id: epochBarock },
    { costume_id: "cc000000-0000-0000-0000-000000000040", term_id: sparteOper },
    { costume_id: "cc000000-0000-0000-0000-000000000040", term_id: matSatin },
    { costume_id: "cc000000-0000-0000-0000-000000000040", term_id: matBrokat },
    { costume_id: "cc000000-0000-0000-0000-000000000040", term_id: colorSilber },
    { costume_id: "cc000000-0000-0000-0000-000000000040", term_id: colorGrau },
    { costume_id: "cc000000-0000-0000-0000-000000000040", term_id: musterOrnament },
  ].filter((l) => l.term_id);

  const { error: linkError } = await supabase
    .from("costume_taxonomy")
    .upsert(links, { onConflict: "costume_id,term_id" });
  if (linkError) console.error("  ⚠️  Taxonomy links:", linkError.message);
  else console.log(`  ✓ Taxonomy links done (${links.length})`);

  console.log("\n✅ Extended seed complete.");
  console.log("   Next step: add costume images to scripts/seed-images/ and run seed-test-images.ts");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
