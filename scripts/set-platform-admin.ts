/**
 * Setzt platform_role = 'platform_admin' für einen User anhand der E-Mail.
 * Run: npx tsx scripts/set-platform-admin.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TARGET_EMAIL = "manuela.vielmi@gmail.com";

async function main() {
  // User anhand E-Mail in auth.users suchen
  const { data: { users }, error: listErr } = await sb.auth.admin.listUsers();
  if (listErr) { console.error("Fehler beim Laden der Users:", listErr.message); return; }

  const user = users.find((u) => u.email === TARGET_EMAIL);
  if (!user) {
    console.error(`User mit E-Mail ${TARGET_EMAIL} nicht gefunden.`);
    return;
  }

  console.log(`User gefunden: ${user.id} (${user.email})`);

  const { error: updateErr } = await sb
    .from("profiles")
    .update({ platform_role: "platform_admin" })
    .eq("id", user.id);

  if (updateErr) { console.error("Fehler beim Update:", updateErr.message); return; }
  console.log(`✓ platform_role = 'platform_admin' gesetzt für ${TARGET_EMAIL}`);
}

main().catch(console.error);
