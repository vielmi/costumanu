import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const EMAILS = [
  "manuela.vielmi@gmail.com",
  "rebecca.rotondari@gmail.com",
  "heidiikaufmann@gmail.com",
];

async function main() {
  const { data: { users }, error } = await sb.auth.admin.listUsers();
  if (error) { console.error("Auth-Fehler:", error.message); return; }

  for (const email of EMAILS) {
    const user = users.find((u) => u.email === email);
    if (!user) { console.log(`❌ Auth-User nicht gefunden: ${email}`); continue; }

    // Check existing profile row
    const { data: existing } = await sb
      .from("profiles")
      .select("id, display_name, platform_role")
      .eq("id", user.id)
      .single();

    console.log(`\n${email} (${user.id})`);
    console.log("  profiles row:", existing ?? "NICHT VORHANDEN");

    // Upsert with platform_admin
    const { error: upsertErr } = await sb.from("profiles").upsert({
      id: user.id,
      platform_role: "platform_admin",
      ...(existing?.display_name ? {} : { display_name: email.split("@")[0] }),
    }, { onConflict: "id" });

    if (upsertErr) {
      console.log("  ❌ Upsert-Fehler:", upsertErr.message);
    } else {
      // Verify
      const { data: after } = await sb
        .from("profiles")
        .select("id, display_name, platform_role")
        .eq("id", user.id)
        .single();
      console.log("  ✓ Nach Upsert:", after);
    }
  }
}

main().catch(console.error);
