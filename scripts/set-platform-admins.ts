import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const EMAILS = ["rebecca.rotondari@gmail.com", "heidiikaufmann@gmail.com"];

async function main() {
  const { data: { users }, error } = await sb.auth.admin.listUsers();
  if (error) { console.error("Fehler:", error.message); return; }

  for (const email of EMAILS) {
    const user = users.find((u) => u.email === email);
    if (!user) { console.log(`Nicht gefunden: ${email}`); continue; }
    const { error: updateErr } = await sb.from("profiles").update({ platform_role: "platform_admin" }).eq("id", user.id);
    if (updateErr) { console.error(`Fehler ${email}: ${updateErr.message}`); }
    else { console.log(`✓ ${email}`); }
  }
}

main().catch(console.error);
