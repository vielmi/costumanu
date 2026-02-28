/**
 * Links all auth users to the test theaters as members.
 * Run with: npx tsx --env-file=.env.local scripts/link-user-to-theaters.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_ACCESS_TOKEN!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const THEATERS = [
  "aa000000-0000-0000-0000-000000000001",
  "aa000000-0000-0000-0000-000000000002",
  "aa000000-0000-0000-0000-000000000003",
];

async function main() {
  // List all users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) { console.error(error); return; }

  console.log(`Found ${users.length} user(s)\n`);

  for (const user of users) {
    console.log(`Linking ${user.email} (${user.id})...`);
    for (const theaterId of THEATERS) {
      await supabase.from("theater_members").upsert(
        { theater_id: theaterId, user_id: user.id, role: "owner" },
        { onConflict: "theater_id,user_id" }
      );
    }
  }

  console.log("\n✅ All users linked to all 3 test theaters as owners.");
}

main().catch(console.error);
