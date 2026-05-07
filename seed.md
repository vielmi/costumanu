# seed.md — kostüm+ Beispieldaten für Supabase

> Dieses File beschreibt das echte Datenbankschema und liefert Beispieldaten
> als direkte Erweiterung der bestehenden Seed-Skripte.
>
> **Bestehende Skripte:**
> - `scripts/seed-test-data.ts` — Hauptdaten (Theaters, Costumes, Taxonomy)
> - `scripts/seed-test-images.ts` — Bilder via Unsplash → Supabase Storage
> - `scripts/link-user-to-theaters.ts` — Auth-User ↔ Theater verknüpfen

---

## Datenbankschema (effektiv)

### Tabellen-Übersicht

| Tabelle | Beschreibung |
|---|---|
| `theaters` | Institutionen (Theater, SRF etc.) |
| `theater_members` | User ↔ Theater Zuordnung mit Rolle |
| `taxonomy_terms` | Zentralisierte Lookup-Tabelle für alle Kategorisierungen |
| `costume_taxonomy` | Many-to-many: Kostüm ↔ Taxonomy-Term |
| `costumes` | Kostüm-Datensätze (logische Einheit, kann Ensemble sein) |
| `costume_items` | Physische Stücke (Barcode, Grösse, Status, Lagerort) |
| `costume_provenance` | Verwendungshistorie (Produktion, Darsteller, Regie) |
| `costume_media` | Bildreferenzen → Supabase Storage Bucket `costume-images` |
| `events` | Call-to-Action / Veranstaltungen |

---

### `theaters`

```typescript
{ id, name, slug, address_info: { street, city, zip }, settings: { allow_external_sharing } }
```

### `taxonomy_terms`

```typescript
{ id, vocabulary, label_de }
```

**Vocabularies und ihre Labels:**

| vocabulary | labels |
|---|---|
| `gender` | Damen, Herren, Kinder, Unisex |
| `clothing_type` | Kleider, Anzüge, Hosen, Mäntel & Jacken, Uniformen, Kopfbedeckungen, Kostüme, Blusen, Röcke, Abendkleider, Ballkleider, Hochzeitskleider |
| `epoche` | Antike, Renaissance, Barock, Rokoko, Biedermeier, Viktorianisch, Belle Époque, Zwanziger Jahre, Dreissiger Jahre, Vierziger Jahre, Fünfziger Jahre, Sechziger Jahre, Zeitgenössisch, Fantastisch |
| `material` | Seide, Wolle, Baumwolle, Samt, Leder, Tüll, Brokat, Taft, Organza, Satin, Spitze, Damast |
| `color` | Schwarz, Weiss, Rot, Blau, Gold, Silber, Grün, Grau, Rosa, Violett, Braun, Creme |
| `sparte` | Oper, Schauspiel, Musical, Ballett, Film, Fernsehen, Performance, Kindertheater |
| `muster` | Uni, Floral, Gestreift, Kariert, Ornamental, Abstrakt, Pünktchen, Damast |

### `costumes`

```typescript
{ id, theater_id, name, description, gender_term_id, clothing_type_id, is_ensemble, parent_costume_id }
```

### `costume_items`

```typescript
{
  id, costume_id, theater_id, barcode_id,
  size_label,                              // z.B. "38", "M", "128"
  size_data: { chest, waist, hip, back_length, shoulder_width },
  condition_grade,                         // 1–5
  current_status,                          // "available" | "rented" | "cleaning" | "in_repair"
  storage_location_path,                   // z.B. "Bern.Stock1.Regal3.Box7"
  is_public_for_rent
}
```

### `costume_provenance`

```typescript
{ id, costume_id, production_title, year, actor_name, role_name, director_name, costume_designer, costume_assistant }
```

### `costume_media`

```typescript
{ id, costume_id, storage_path, sort_order }
// storage_path: "{theater_id}/{costume_id}/{index}.jpg"
// Supabase Storage Bucket: "costume-images"
```

### `events`

```typescript
{ id, theater_id, title, description, event_date, is_published }
```

---

## Bestehende Fixed UUIDs (nicht überschreiben)

```typescript
// Theaters (bestehend)
THEATER_1 = "aa000000-0000-0000-0000-000000000001"  // Bühne Bern
THEATER_2 = "aa000000-0000-0000-0000-000000000002"  // Schauspielhaus Zürich
THEATER_3 = "aa000000-0000-0000-0000-000000000003"  // Theater Basel

// Costumes bestehend: cc...0001 – cc...0010
// Ensemble-Teile bestehend: cc...0011 – cc...0013
// Items bestehend: bb...0001 – bb...0010
// Provenance bestehend: dd...0001 – dd...0011
// Events bestehend: ee...0001 – ee...0002
```

---

## Neue Theater (ergänzen zu seed-test-data.ts)

```typescript
const THEATER_4 = "aa000000-0000-0000-0000-000000000004"; // Luzerner Theater
const THEATER_5 = "aa000000-0000-0000-0000-000000000005"; // SRF
const THEATER_6 = "aa000000-0000-0000-0000-000000000006"; // Opernhaus Zürich

await supabase.from("theaters").upsert([
  {
    id: THEATER_4, name: "Luzerner Theater", slug: "luzerner-theater",
    address_info: { street: "Theaterstrasse 2", city: "Luzern", zip: "6003" },
    settings: { allow_external_sharing: true },
  },
  {
    id: THEATER_5, name: "SRF", slug: "srf",
    address_info: { street: "Fernsehstrasse 1–4", city: "Zürich", zip: "8052" },
    settings: { allow_external_sharing: false },
  },
  {
    id: THEATER_6, name: "Opernhaus Zürich", slug: "opernhaus-zuerich",
    address_info: { street: "Falkenstrasse 1", city: "Zürich", zip: "8008" },
    settings: { allow_external_sharing: true },
  },
], { onConflict: "id" });
```

---

## Erweiterte Taxonomy Terms

> Diese Terms müssen existieren, bevor costumes geseedet werden.
> Ergänzung zu den bestehenden Terms aus den Migrations.

```typescript
// Neue Terms, die für die 20 Kostüme benötigt werden:
const newTerms = [
  // Clothing types (neue)
  { vocabulary: "clothing_type", label_de: "Kostüme" },
  { vocabulary: "clothing_type", label_de: "Abendkleider" },
  { vocabulary: "clothing_type", label_de: "Ballkleider" },
  { vocabulary: "clothing_type", label_de: "Hochzeitskleider" },
  { vocabulary: "clothing_type", label_de: "Röcke" },
  // Epochen (neue)
  { vocabulary: "epoche", label_de: "Renaissance" },
  { vocabulary: "epoche", label_de: "Viktorianisch" },
  { vocabulary: "epoche", label_de: "Belle Époque" },
  { vocabulary: "epoche", label_de: "Dreissiger Jahre" },
  { vocabulary: "epoche", label_de: "Vierziger Jahre" },
  { vocabulary: "epoche", label_de: "Fünfziger Jahre" },
  { vocabulary: "epoche", label_de: "Fantastisch" },
  // Materialien (neue)
  { vocabulary: "material", label_de: "Tüll" },
  { vocabulary: "material", label_de: "Brokat" },
  { vocabulary: "material", label_de: "Taft" },
  { vocabulary: "material", label_de: "Satin" },
  { vocabulary: "material", label_de: "Spitze" },
  { vocabulary: "material", label_de: "Damast" },
  { vocabulary: "material", label_de: "Organza" },
  // Farben (neue)
  { vocabulary: "color", label_de: "Silber" },
  { vocabulary: "color", label_de: "Grün" },
  { vocabulary: "color", label_de: "Grau" },
  { vocabulary: "color", label_de: "Rosa" },
  { vocabulary: "color", label_de: "Violett" },
  { vocabulary: "color", label_de: "Creme" },
  // Sparten (neue)
  { vocabulary: "sparte", label_de: "Ballett" },
  { vocabulary: "sparte", label_de: "Fernsehen" },
  { vocabulary: "sparte", label_de: "Performance" },
  // Muster (neue)
  { vocabulary: "muster", label_de: "Ornamental" },
  { vocabulary: "muster", label_de: "Abstrakt" },
  { vocabulary: "muster", label_de: "Pünktchen" },
  { vocabulary: "muster", label_de: "Damast" },
];

await supabase.from("taxonomy_terms").upsert(newTerms, { onConflict: "vocabulary,label_de" });
```

---

## 20 Neue Kostüme

> Erweiterung von seed-test-data.ts
> IDs beginnen bei cc...0021 (0011–0013 = bestehende Ensemble-Teile)

```typescript
const THEATER_4 = "aa000000-0000-0000-0000-000000000004"; // Luzerner Theater
const THEATER_5 = "aa000000-0000-0000-0000-000000000005"; // SRF
const THEATER_6 = "aa000000-0000-0000-0000-000000000006"; // Opernhaus Zürich

// Taxonomy helper (nach neuem load von allTerms)
const genderDamen  = term("gender", "Damen")!;
const genderUnisex = term("gender", "Unisex")!;

const typeKleider  = term("clothing_type", "Kleider")!;
const typeMaentel  = term("clothing_type", "Mäntel & Jacken")!;
const typeKostueme = term("clothing_type", "Kostüme")!;
const typeBall     = term("clothing_type", "Ballkleider")!;
const typeAbend    = term("clothing_type", "Abendkleider")!;
const typeHochzeit = term("clothing_type", "Hochzeitskleider")!;

const costumesNew = [
  {
    id: "cc000000-0000-0000-0000-000000000021",
    theater_id: THEATER_1,
    name: "Romantisches Schichtkleid Blaugrau/Rosa",
    description: "Zweiteiliges Kostüm: hellblaugrauer Gehrock mit Knopfleiste und Epauletten über einem rosé-weissen Rüschenrock mit Spitzenbesatz. Viktorianisch-romantischer Stil.",
    gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000022",
    theater_id: THEATER_4,
    name: "Barocker Schnürkorsett-Mantel Bronze/Gold",
    description: "Langer Taillenmantel aus bronzefarbenem Brokat mit goldenen Ornamentmotiven. Schnürung vorne, tailliert, ausgestellte Schösse.",
    gender_term_id: genderDamen, clothing_type_id: typeMaentel, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000023",
    theater_id: THEATER_4,
    name: "Barockes Hofkleid Gelbgrün/Gold",
    description: "Grosses Hofkleid aus Damastgewebe in Gelbgrün und Gold mit floralen Brokatmotiven, weissen Spitzenärmeln und goldener Gürtelgarnitur. Für Königinnendarstellungen.",
    gender_term_id: genderDamen, clothing_type_id: typeBall, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000024",
    theater_id: THEATER_5,
    name: "Fantasy Regenkleid Grün/Weiss",
    description: "Abstraktes Kostüm in Form eines Regenschauers. Grün-weisses Vichykaro-Kostüm mit aufgesetzten Regentropfen aus Stoff und einer Wolkenskulptur als Schulterpartie.",
    gender_term_id: genderUnisex, clothing_type_id: typeKostueme, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000025",
    theater_id: THEATER_3,
    name: "Viktorianisches Bolero-Jacket Royalblau",
    description: "Kurzes Bolero-Jacket aus königsblauem Samt mit Spitzenbesatz an Kragen, Schultern und Manschetten. Weisse Spitzenbluse darunter. Reich verziert mit Perlenschmuck.",
    gender_term_id: genderDamen, clothing_type_id: typeMaentel, is_ensemble: true,
  },
  {
    id: "cc000000-0000-0000-0000-000000000026",
    theater_id: THEATER_4,
    name: "Barocker Gehrock Blau/Gold Brokat",
    description: "Taillenbetonter langer Gehrock aus blauem und goldfarbenem Brokat mit Blumenmotiven. Grossvolumige Satinschleife am Kragen, Satinbänder an Ärmeln, schwarzer Faltrock.",
    gender_term_id: genderDamen, clothing_type_id: typeMaentel, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000027",
    theater_id: THEATER_4,
    name: "Pierrot-Kostüm Rosa Tüll mit Harlekin-Strumpfhose",
    description: "Grossvolumiges Pierrot-Kostüm aus mehrlagigem rosa Tüll als Schulter-Cape-Kleid. Dazu schwarz-weisse Harlekin-Rauten-Strumpfhose. Für Clown-/Commedia-dell'arte-Darstellungen.",
    gender_term_id: genderUnisex, clothing_type_id: typeKostueme, is_ensemble: true,
  },
  {
    id: "cc000000-0000-0000-0000-000000000028",
    theater_id: THEATER_6,
    name: "Rokoko-Ballkleid Gelb/Creme Marie-Antoinette-Stil",
    description: "Grosses Rokoko-Ballkleid aus gelbem Karostoff mit cremeweissen Rüschenbahnen und Schleifenverzierungen. Mintgrüne Schleife am Ausschnitt.",
    gender_term_id: genderDamen, clothing_type_id: typeBall, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000029",
    theater_id: THEATER_4,
    name: "Flapper-Kleid Schwarz mit Spitze",
    description: "Knielanges 1920er Abendkleid aus schwarzem Chiffon mit Spitzen-Oberteil, Pünktchen-Tüll und fein plissierten Lagen. Für Jazz-Age und Weimarer-Republik-Darstellungen.",
    gender_term_id: genderDamen, clothing_type_id: typeAbend, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000030",
    theater_id: THEATER_1,
    name: "Ballkleid Blaugrau Taft 50er-Jahre",
    description: "Tailliertes Abendkleid aus blaugrauem Taft mit weitem Stufenrock. Bootneck-Ausschnitt, Satinschleife am Bund. Typischer New-Look der 1950er Jahre.",
    gender_term_id: genderDamen, clothing_type_id: typeBall, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000031",
    theater_id: THEATER_6,
    name: "Cocktailkleid Weiss mit Perlen- und Kristallstickerei",
    description: "Kurzes Festkleid aus weissem Tüll mit vollflächiger Perl- und Kristallstickerei am Oberteil und feinem Blumenmuster im Rock.",
    gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000032",
    theater_id: THEATER_4,
    name: "Stufenballkleid Mintgrün mit Olivschärpe",
    description: "Schulterfreies Stufenballkleid aus mintgrünem Taft mit drei Volantlagen. Breite olivgrüne Samtschärpe am Bund. New-Look-Stil der 1950er Jahre.",
    gender_term_id: genderDamen, clothing_type_id: typeBall, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000033",
    theater_id: THEATER_6,
    name: "Off-Shoulder Cocktailkleid Silberblau",
    description: "Elegantes Off-Shoulder-Kleid aus silberblauem Dupion-Seidenstoff. Schulterübergreifende Draperie, seitliche Knopfleiste, weit schwingender Rock.",
    gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000034",
    theater_id: THEATER_1,
    name: "Abendkleid Creme mit Blumenstickerei",
    description: "Grosses Abendkleid aus cremefarbenem Satin mit vollflächiger Blumen- und Zweigstickerei in Violett und Grün. Herzausschnitt, tailliert, weit schwingender Rock.",
    gender_term_id: genderDamen, clothing_type_id: typeAbend, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000035",
    theater_id: THEATER_1,
    name: "Brautkleid Weiss Satin Modern",
    description: "Modernes Brautkleid aus weissem Satin mit tiefem V-Ausschnitt, Wickeloptik im Oberteil und langem Schlepprock. Minimalistisch-elegant, zeitloser Schnitt.",
    gender_term_id: genderDamen, clothing_type_id: typeHochzeit, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000036",
    theater_id: THEATER_1,
    name: "Marineblauer Taft Midirock mit Schleife",
    description: "Tailliertes Midi-Kleid aus marineblauen Taft mit Stehkragen, Schleife und Blütenbrosche. Weiter Schwingrock mit weissem Tüll-Unterkleid. Zeitgenössisch mit 50er-Einfluss.",
    gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000037",
    theater_id: THEATER_5,
    name: "Cremefarbenes Tüll-Drapéekleid mit Satinband",
    description: "Knielang-asymmetrisches Drapéekleid aus mehrlagigem cremefarbenen Tüll. Breites Satinband in Taupe als Bindegürtel. Zeitgenössisch, für Tanzproduktionen geeignet.",
    gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000038",
    theater_id: THEATER_5,
    name: "Avant-Garde Rüschen-Ensemble Grau-Silber",
    description: "Zweiteiliges Avant-Garde-Kostüm aus grau-silbernem Satin: Kurzjacke mit Puffärmeln und langer Rüschenrock aus gerafften Bahnen. Skulpturaler, performativer Charakter.",
    gender_term_id: genderUnisex, clothing_type_id: typeKostueme, is_ensemble: true,
  },
  {
    id: "cc000000-0000-0000-0000-000000000039",
    theater_id: THEATER_1,
    name: "Violettes Taft-Kleid mit Blütenbrosche",
    description: "Tailliertes Midi-Kleid aus violettem Taft mit Stehkragen und Dreiviertelärmel. Hellblaue Blütenbrosche an der Brust. Zeitgenössisch mit 50er-Einfluss.",
    gender_term_id: genderDamen, clothing_type_id: typeKleider, is_ensemble: false,
  },
  {
    id: "cc000000-0000-0000-0000-000000000040",
    theater_id: THEATER_4,
    name: "Barockes Hofkleid Silber-Grau mit Schleppe",
    description: "Grosses zweiteiliges Hofkleid aus silbergrauem Satin mit Brokatbesatz. Oberteil mit Brokat-Einlage, grosser Schlepprock, schwarze Handschuhe. Für Queen/Gräfinnen-Darstellungen.",
    gender_term_id: genderDamen, clothing_type_id: typeBall, is_ensemble: false,
  },
];

await supabase.from("costumes").upsert(costumesNew, { onConflict: "id" });
```

---

## Costume Items (physische Stücke)

```typescript
const itemsNew = [
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
];

await supabase.from("costume_items").upsert(itemsNew, { onConflict: "id" });
```

---

## Provenance (Verwendungshistorie)

```typescript
await supabase.from("costume_provenance").upsert([
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
```

---

## Taxonomy Links (costume_taxonomy)

```typescript
// Lookup nach vollständigem Reload von allTerms:
const epochViktor  = term("epoche", "Viktorianisch")!;
const epochBarock  = term("epoche", "Barock")!;
const epochRokoko  = term("epoche", "Rokoko")!;
const epoch20er    = term("epoche", "Zwanziger Jahre")!;
const epoch50er    = term("epoche", "Fünfziger Jahre")!;
const epochZeitgen = term("epoche", "Zeitgenössisch")!;
const epochFantasy = term("epoche", "Fantastisch")!;

const matSeide  = term("material", "Seide")!;
const matSamt   = term("material", "Samt")!;
const matBrokat = term("material", "Brokat")!;
const matTuell  = term("material", "Tüll")!;
const matTaft   = term("material", "Taft")!;
const matSatin  = term("material", "Satin")!;
const matSpitze = term("material", "Spitze")!;
const matBaumw  = term("material", "Baumwolle")!;

const colorSchwarz = term("color", "Schwarz")!;
const colorWeiss   = term("color", "Weiss")!;
const colorGold    = term("color", "Gold")!;
const colorBlau    = term("color", "Blau")!;
const colorSilber  = term("color", "Silber")!;
const colorGruen   = term("color", "Grün")!;
const colorGrau    = term("color", "Grau")!;
const colorRosa    = term("color", "Rosa")!;
const colorViolett = term("color", "Violett")!;
const colorCreme   = term("color", "Creme")!;

const sparteOper      = term("sparte", "Oper")!;
const sparteSchauspiel= term("sparte", "Schauspiel")!;
const sparteBallett   = term("sparte", "Ballett")!;
const sparteFernsehen = term("sparte", "Fernsehen")!;
const spartePerform   = term("sparte", "Performance")!;

const musterUni      = term("muster", "Uni")!;
const musterFloral   = term("muster", "Floral")!;
const musterKariert  = term("muster", "Kariert")!;
const musterOrnament = term("muster", "Ornamental")!;
const musterAbstrakt = term("muster", "Abstrakt")!;
const musterDamast   = term("muster", "Damast")!;

const taxonomyLinksNew = [
  // 21 — Schichtkleid Blaugrau/Rosa
  { costume_id: "cc000000-0000-0000-0000-000000000021", term_id: epochViktor },
  { costume_id: "cc000000-0000-0000-0000-000000000021", term_id: sparteSchauspiel },
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
  { costume_id: "cc000000-0000-0000-0000-000000000024", term_id: sparteFernsehen },
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
  { costume_id: "cc000000-0000-0000-0000-000000000027", term_id: sparteSchauspiel },
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
  { costume_id: "cc000000-0000-0000-0000-000000000029", term_id: sparteSchauspiel },
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
  { costume_id: "cc000000-0000-0000-0000-000000000034", term_id: sparteSchauspiel },
  { costume_id: "cc000000-0000-0000-0000-000000000034", term_id: matSatin },
  { costume_id: "cc000000-0000-0000-0000-000000000034", term_id: colorCreme },
  { costume_id: "cc000000-0000-0000-0000-000000000034", term_id: colorViolett },
  { costume_id: "cc000000-0000-0000-0000-000000000034", term_id: musterFloral },
  // 35 — Brautkleid Satin
  { costume_id: "cc000000-0000-0000-0000-000000000035", term_id: epochZeitgen },
  { costume_id: "cc000000-0000-0000-0000-000000000035", term_id: sparteSchauspiel },
  { costume_id: "cc000000-0000-0000-0000-000000000035", term_id: matSatin },
  { costume_id: "cc000000-0000-0000-0000-000000000035", term_id: colorWeiss },
  { costume_id: "cc000000-0000-0000-0000-000000000035", term_id: musterUni },
  // 36 — Marineblauer Taft Midirock
  { costume_id: "cc000000-0000-0000-0000-000000000036", term_id: epoch50er },
  { costume_id: "cc000000-0000-0000-0000-000000000036", term_id: sparteSchauspiel },
  { costume_id: "cc000000-0000-0000-0000-000000000036", term_id: matTaft },
  { costume_id: "cc000000-0000-0000-0000-000000000036", term_id: matTuell },
  { costume_id: "cc000000-0000-0000-0000-000000000036", term_id: colorBlau },
  { costume_id: "cc000000-0000-0000-0000-000000000036", term_id: musterUni },
  // 37 — Tüll-Drapéekleid Creme
  { costume_id: "cc000000-0000-0000-0000-000000000037", term_id: epochZeitgen },
  { costume_id: "cc000000-0000-0000-0000-000000000037", term_id: sparteFernsehen },
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
  { costume_id: "cc000000-0000-0000-0000-000000000039", term_id: sparteSchauspiel },
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

await supabase.from("costume_taxonomy").upsert(taxonomyLinksNew, { onConflict: "costume_id,term_id" });
```

---

## Bilder (seed-test-images.ts Erweiterung)

> Gleiches Muster wie bestehendes Script: Bilder werden von Unsplash geladen.
> Kein manuelles Ablegen von Dateien nötig.
> Einfach den Block unten in `seed-test-images.ts` bei `costumeImages` ergänzen.

### Ergänzung für `costumeImages` in seed-test-images.ts

```typescript
// In costumeImages Record ergänzen (ab Zeile ~12):
"cc000000-0000-0000-0000-000000000021": [
  "photo-1595777457583-95e059d581b8", // layered romantic dress blue-grey
  "photo-1518611012118-696072aa579a", // vintage gown detail
],
"cc000000-0000-0000-0000-000000000022": [
  "photo-1566174053879-31528523f8ae", // bronze brocade coat
  "photo-1509631179647-0177331693ae", // corset detail
],
"cc000000-0000-0000-0000-000000000023": [
  "photo-1518611012118-696072aa579a", // baroque gold gown
  "photo-1503944583220-79d8926ad5e2", // historic costume full view
],
"cc000000-0000-0000-0000-000000000024": [
  "photo-1558618666-fcd25c85cd64", // green abstract costume
],
"cc000000-0000-0000-0000-000000000025": [
  "photo-1594938298603-c8148c4dae35", // blue velvet bolero
  "photo-1509631179647-0177331693ae", // lace detail
],
"cc000000-0000-0000-0000-000000000026": [
  "photo-1566174053879-31528523f8ae", // blue gold brocade coat
  "photo-1518611012118-696072aa579a", // baroque coat detail
],
"cc000000-0000-0000-0000-000000000027": [
  "photo-1558618666-fcd25c85cd64", // pink tulle pierrot
  "photo-1578662996442-48f60103fc96", // performance costume
],
"cc000000-0000-0000-0000-000000000028": [
  "photo-1518611012118-696072aa579a", // rococo yellow ballgown
  "photo-1503944583220-79d8926ad5e2", // historic gown full
],
"cc000000-0000-0000-0000-000000000029": [
  "photo-1515886657613-9f3515b0c78f", // black flapper dress
  "photo-1509631179647-0177331693ae", // lace detail 1920s
],
"cc000000-0000-0000-0000-000000000030": [
  "photo-1595777457583-95e059d581b8", // blue-grey taffeta 1950s
  "photo-1566174053879-31528523f8ae", // full skirt vintage
],
"cc000000-0000-0000-0000-000000000031": [
  "photo-1519741497674-611481863552", // white embellished dress
  "photo-1522653216850-4f1415a174fb", // crystal detail
],
"cc000000-0000-0000-0000-000000000032": [
  "photo-1595777457583-95e059d581b8", // mint green tiered dress
],
"cc000000-0000-0000-0000-000000000033": [
  "photo-1515886657613-9f3515b0c78f", // silver blue off-shoulder
  "photo-1566174053879-31528523f8ae", // 1950s cocktail dress
],
"cc000000-0000-0000-0000-000000000034": [
  "photo-1519741497674-611481863552", // cream embroidered gown
  "photo-1518611012118-696072aa579a", // floral embroidery detail
],
"cc000000-0000-0000-0000-000000000035": [
  "photo-1519741497674-611481863552", // modern white wedding dress
  "photo-1522653216850-4f1415a174fb", // satin wedding detail
],
"cc000000-0000-0000-0000-000000000036": [
  "photo-1515886657613-9f3515b0c78f", // navy blue midi dress
],
"cc000000-0000-0000-0000-000000000037": [
  "photo-1558618666-fcd25c85cd64", // cream tulle draped dress
],
"cc000000-0000-0000-0000-000000000038": [
  "photo-1578662996442-48f60103fc96", // grey silver avant-garde
  "photo-1509631179647-0177331693ae", // ruffle detail
],
"cc000000-0000-0000-0000-000000000039": [
  "photo-1515886657613-9f3515b0c78f", // violet taffeta dress
],
"cc000000-0000-0000-0000-000000000040": [
  "photo-1518611012118-696072aa579a", // silver grey baroque gown
  "photo-1503944583220-79d8926ad5e2", // historic costume with train
],
```

### Ergänzung für `costumeTheaters` in seed-test-images.ts

```typescript
// In costumeTheaters Record ergänzen:
"cc000000-0000-0000-0000-000000000021": "aa000000-0000-0000-0000-000000000001",
"cc000000-0000-0000-0000-000000000022": "aa000000-0000-0000-0000-000000000004",
"cc000000-0000-0000-0000-000000000023": "aa000000-0000-0000-0000-000000000004",
"cc000000-0000-0000-0000-000000000024": "aa000000-0000-0000-0000-000000000005",
"cc000000-0000-0000-0000-000000000025": "aa000000-0000-0000-0000-000000000003",
"cc000000-0000-0000-0000-000000000026": "aa000000-0000-0000-0000-000000000004",
"cc000000-0000-0000-0000-000000000027": "aa000000-0000-0000-0000-000000000004",
"cc000000-0000-0000-0000-000000000028": "aa000000-0000-0000-0000-000000000006",
"cc000000-0000-0000-0000-000000000029": "aa000000-0000-0000-0000-000000000004",
"cc000000-0000-0000-0000-000000000030": "aa000000-0000-0000-0000-000000000001",
"cc000000-0000-0000-0000-000000000031": "aa000000-0000-0000-0000-000000000006",
"cc000000-0000-0000-0000-000000000032": "aa000000-0000-0000-0000-000000000004",
"cc000000-0000-0000-0000-000000000033": "aa000000-0000-0000-0000-000000000006",
"cc000000-0000-0000-0000-000000000034": "aa000000-0000-0000-0000-000000000001",
"cc000000-0000-0000-0000-000000000035": "aa000000-0000-0000-0000-000000000001",
"cc000000-0000-0000-0000-000000000036": "aa000000-0000-0000-0000-000000000001",
"cc000000-0000-0000-0000-000000000037": "aa000000-0000-0000-0000-000000000005",
"cc000000-0000-0000-0000-000000000038": "aa000000-0000-0000-0000-000000000005",
"cc000000-0000-0000-0000-000000000039": "aa000000-0000-0000-0000-000000000001",
"cc000000-0000-0000-0000-000000000040": "aa000000-0000-0000-0000-000000000004",
```

---

## Neue Events

```typescript
await supabase.from("events").upsert([
  {
    id: "ee000000-0000-0000-0000-000000000003",
    theater_id: THEATER_4,
    title: "Rampenverkauf Fundus Südpol Luzern",
    description: "Über 2'000 Kostüme, Accessoires und Requisiten aus dem Fundus des Luzerner Theaters zu günstigen Preisen. Eintritt frei.",
    event_date: "2026-05-10",
    is_published: true,
  },
  {
    id: "ee000000-0000-0000-0000-000000000004",
    theater_id: THEATER_5,
    title: "Neue Kollektion SRF Kostümabteilung",
    description: "40 neue Kostüme aus abgeschlossenen SRF-Produktionen nun im Verleih verfügbar.",
    event_date: "2026-04-15",
    is_published: true,
  },
], { onConflict: "id" });
```

---

## Nicht als Seed befüllen

| Thema | Grund |
|---|---|
| Chatnachrichten | Entstehen dynamisch im Betrieb |
| Anfragen & Details | Entstehen dynamisch im Betrieb |
| Nachrichten (Inbox) | Entstehen dynamisch im Betrieb |
| Konkrete Datumsangaben | Immer relativ zum heutigen Datum |
| Tastatur-States | Native Mobile-Tastatur |
| Merklisten-Namen | Benutzerspezifisch |

---

*Projekt: kostüm+ / costumanu — Beispieldaten, keine echten Personendaten*

