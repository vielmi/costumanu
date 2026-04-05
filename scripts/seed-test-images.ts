/**
 * Downloads costume-related stock photos from Unsplash and uploads them
 * to Supabase Storage, then creates costume_media records.
 *
 * Run with: npx tsx --env-file=.env.local scripts/seed-test-images.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ACCESS_TOKEN!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Costume ID → array of Unsplash photo IDs (costume/fashion themed)
const costumeImages: Record<string, string[]> = {
  // 1: Roter Ballkleid Traum (red ball gown)
  "cc000000-0000-0000-0000-000000000001": [
    "photo-1566174053879-31528523f8ae", // red dress
    "photo-1518611012118-696072aa579a", // elegant gown
  ],
  // 2: Schwarzer Dreiteiler Barock (black baroque suit)
  "cc000000-0000-0000-0000-000000000002": [
    "photo-1507003211169-0a1dd7228f2d", // formal suit
    "photo-1594938298603-c8148c4dae35", // dark suit detail
  ],
  // 3: Militäruniform (military uniform)
  "cc000000-0000-0000-0000-000000000003": [
    "photo-1578662996442-48f60103fc96", // military uniform
    "photo-1543269865-cbf427effbad", // uniform detail
  ],
  // 4: Rokoko Reifrock (rococo hoop skirt)
  "cc000000-0000-0000-0000-000000000004": [
    "photo-1518611012118-696072aa579a", // elaborate dress
    "photo-1595777457583-95e059d581b8", // vintage dress
  ],
  // 5: Lederjacke Zeitgenössisch (leather jacket)
  "cc000000-0000-0000-0000-000000000005": [
    "photo-1551028719-00167b16eac5", // leather jacket
    "photo-1521223890158-f9f7c3d5d504", // jacket detail
  ],
  // 6: Goldene Abendgarderobe (golden evening wear)
  "cc000000-0000-0000-0000-000000000006": [
    "photo-1595777457583-95e059d581b8", // golden dress
    "photo-1566174053879-31528523f8ae", // evening wear
  ],
  // 7: Matrosenhose Vintage (vintage sailor pants)
  "cc000000-0000-0000-0000-000000000007": [
    "photo-1594938298603-c8148c4dae35", // vintage pants
  ],
  // 8: Kinderkostüm Kleiner Prinz (child costume)
  "cc000000-0000-0000-0000-000000000008": [
    "photo-1503944583220-79d8926ad5e2", // child costume
  ],
  // 9: Zylinderhat (top hat)
  "cc000000-0000-0000-0000-000000000009": [
    "photo-1529064541268-c8e5c4cbdfc1", // top hat
  ],
  // 10: Weisses Hochzeitskleid (white wedding dress)
  "cc000000-0000-0000-0000-000000000010": [
    "photo-1519741497674-611481863552", // wedding dress
    "photo-1522653216850-4f1415a174fb", // white dress detail
  ],
};

// Map costume IDs to their theater IDs
const costumeTheaters: Record<string, string> = {
  "cc000000-0000-0000-0000-000000000001": "aa000000-0000-0000-0000-000000000001",
  "cc000000-0000-0000-0000-000000000002": "aa000000-0000-0000-0000-000000000001",
  "cc000000-0000-0000-0000-000000000003": "aa000000-0000-0000-0000-000000000002",
  "cc000000-0000-0000-0000-000000000004": "aa000000-0000-0000-0000-000000000001",
  "cc000000-0000-0000-0000-000000000005": "aa000000-0000-0000-0000-000000000002",
  "cc000000-0000-0000-0000-000000000006": "aa000000-0000-0000-0000-000000000003",
  "cc000000-0000-0000-0000-000000000007": "aa000000-0000-0000-0000-000000000001",
  "cc000000-0000-0000-0000-000000000008": "aa000000-0000-0000-0000-000000000003",
  "cc000000-0000-0000-0000-000000000009": "aa000000-0000-0000-0000-000000000002",
  "cc000000-0000-0000-0000-000000000010": "aa000000-0000-0000-0000-000000000001",
};

async function downloadImage(photoId: string): Promise<Buffer> {
  const url = `https://images.unsplash.com/${photoId}?w=600&h=800&fit=crop&q=80`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${photoId}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  console.log("📸 Seeding test images...\n");

  // First, clear existing test media records
  for (const costumeId of Object.keys(costumeImages)) {
    await supabase.from("costume_media").delete().eq("costume_id", costumeId);
  }

  let totalUploaded = 0;

  for (const [costumeId, photoIds] of Object.entries(costumeImages)) {
    const theaterId = costumeTheaters[costumeId];
    console.log(`Uploading ${photoIds.length} image(s) for costume ${costumeId.slice(-2)}...`);

    for (let i = 0; i < photoIds.length; i++) {
      const photoId = photoIds[i];
      try {
        const imageBuffer = await downloadImage(photoId);
        const storagePath = `${theaterId}/${costumeId}/${i + 1}.jpg`;

        // Upload to storage (upsert to overwrite if exists)
        const { error: uploadError } = await supabase.storage
          .from("costume-images")
          .upload(storagePath, imageBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error(`  ❌ Upload failed: ${uploadError.message}`);
          continue;
        }

        // Create media record
        const { error: mediaError } = await supabase
          .from("costume_media")
          .insert({
            costume_id: costumeId,
            storage_path: storagePath,
            sort_order: i,
          });

        if (mediaError) {
          console.error(`  ❌ Media record failed: ${mediaError.message}`);
          continue;
        }

        totalUploaded++;
        console.log(`  ✓ ${storagePath}`);
      } catch (err) {
        console.error(`  ❌ Failed for ${photoId}:`, (err as Error).message);
      }
    }
  }

  console.log(`\n✅ Uploaded ${totalUploaded} images to Supabase Storage.`);
  console.log("💡 Refresh the app to see images on costume pages.");
}

main().catch(console.error);
