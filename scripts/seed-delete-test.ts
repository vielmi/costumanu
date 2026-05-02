/**
 * Erstellt 3 Test-Kostüme mit Bildern für Manuela (Theater 6426a71b)
 * Run: npx tsx scripts/seed-delete-test.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const THEATER_ID = "6426a71b-2597-4de0-b18f-6f9d4ec4d6eb";

// Taxonomy IDs aus DB (abgefragt am 2026-04-30)
const GENDER_DAMEN    = "184eb0e5-c60b-4c99-b889-6f5d5657366b";
const GENDER_HERREN   = "93781156-76fe-4ecc-9d2f-f7ec40d55816";
const GENDER_UNISEX   = "724f4984-eaa1-4aef-b231-031765b3e545";
const CLOTH_KLEID     = "a879f7cc-7536-425c-8df8-ab19ddf647b5";
const CLOTH_HOSE      = "b0dee814-b8e9-45e4-9b4b-387095f447ac";
const CLOTH_ANZUG     = "05ef4ac7-527f-40c3-bb23-54b44a5fa05f";
const COLOR_BLAU      = "fd5cb4f8-da3b-4d37-93a6-ddde9015ec43";
const COLOR_BEIGE     = "4b24ade8-ff1b-49a9-bbf9-f52ae1bc4901";
const COLOR_BORDEAUX  = "67a9e09b-eaf8-4ea3-b1cc-81112f7899e0";

// Picsum-Bilder (stabile IDs, freie Fotos)
const TEST_IMAGES = [
  { url: "https://picsum.photos/id/292/600/900", suffix: "kleid-blau" },
  { url: "https://picsum.photos/id/433/600/900", suffix: "anzug-beige" },
  { url: "https://picsum.photos/id/177/600/900", suffix: "rock-bordeaux" },
];

async function uploadImage(url: string, costumeId: string, suffix: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const storagePath = `${THEATER_ID}/${costumeId}/${suffix}.jpg`;
    const { error } = await sb.storage.from("costume-images").upload(storagePath, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) { console.error(`  ⚠️  Upload failed: ${error.message}`); return null; }
    return storagePath;
  } catch (e) {
    console.error(`  ⚠️  Fetch/upload error: ${e}`);
    return null;
  }
}

interface CostumeInsert {
  name: string;
  description: string;
  genderId: string;
  clothingTypeId: string;
  colorIds: string[];
  imageIndex: number;
}

const COSTUMES: CostumeInsert[] = [
  {
    name: "Blaues Abendkleid (Test)",
    description: "Langes Abendkleid in Kobaltblau, Seidensatin, für Produktionstests.",
    genderId: GENDER_DAMEN,
    clothingTypeId: CLOTH_KLEID,
    colorIds: [COLOR_BLAU],
    imageIndex: 0,
  },
  {
    name: "Beiger Herrenanzug (Test)",
    description: "Zweiteiliger Sommeranzug, Beige, Leinenmischung.",
    genderId: GENDER_HERREN,
    clothingTypeId: CLOTH_ANZUG,
    colorIds: [COLOR_BEIGE],
    imageIndex: 1,
  },
  {
    name: "Bordeaux Kombination (Test)",
    description: "Unisex-Kombination in Bordeaux, Hose und Oberteil.",
    genderId: GENDER_UNISEX,
    clothingTypeId: CLOTH_HOSE,
    colorIds: [COLOR_BORDEAUX],
    imageIndex: 2,
  },
];

async function main() {
  console.log("🎭 Erstelle Test-Kostüme für Löschen-Test...\n");

  for (const c of COSTUMES) {
    // 1. Kostüm anlegen
    const { data: costume, error: cErr } = await sb.from("costumes").insert({
      theater_id: THEATER_ID,
      name: c.name,
      description: c.description,
      gender_term_id: c.genderId,
      clothing_type_id: c.clothingTypeId,
    }).select("id").single();

    if (cErr || !costume) {
      console.error(`❌ Kostüm "${c.name}" fehlgeschlagen:`, cErr?.message);
      continue;
    }
    console.log(`✓ Kostüm: ${c.name} (${costume.id})`);

    // 2. Farben verknüpfen (costume_taxonomy)
    const taxRows = c.colorIds.map(term_id => ({ costume_id: costume.id, term_id }));
    const { error: tErr } = await sb.from("costume_taxonomy").insert(taxRows);
    if (tErr) console.error(`  ⚠️  Taxonomy: ${tErr.message}`);
    else console.log(`  ✓ Farben verknüpft`);

    // 3. Bild hochladen und verknüpfen
    const img = TEST_IMAGES[c.imageIndex];
    console.log(`  ↑ Lade Bild hoch: ${img.url}`);
    const storagePath = await uploadImage(img.url, costume.id, img.suffix);
    if (storagePath) {
      const { error: mErr } = await sb.from("costume_media").insert({
        costume_id: costume.id,
        storage_path: storagePath,
        sort_order: 0,
      });
      if (mErr) console.error(`  ⚠️  Media: ${mErr.message}`);
      else console.log(`  ✓ Bild verknüpft: ${storagePath}`);
    }

    console.log();
  }

  console.log("✅ Fertig. Die Kostüme sind nun im Cockpit sichtbar.");
  console.log(`   Theater: ${THEATER_ID}`);
}

main().catch(console.error);
