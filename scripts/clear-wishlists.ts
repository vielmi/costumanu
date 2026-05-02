/**
 * Löscht alle wishlist_items und wishlists des Users (für lokale Tests).
 * Run: npx tsx scripts/clear-wishlists.ts
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

const USER_EMAIL = "manuela.vielmi@gmail.com";

async function main() {
  // User-ID aus Auth holen
  const { data: { users }, error: authErr } = await sb.auth.admin.listUsers();
  if (authErr) { console.error("Auth error:", authErr.message); process.exit(1); }

  const user = users.find(u => u.email === USER_EMAIL);
  if (!user) { console.error(`User ${USER_EMAIL} nicht gefunden`); process.exit(1); }

  console.log(`User: ${user.id}`);

  // wishlist_items via cascade gelöscht wenn FK ON DELETE CASCADE gesetzt ist,
  // sonst erst manuell löschen
  const { data: lists } = await sb
    .from("wishlists")
    .select("id")
    .eq("owner_id", user.id);

  if (!lists?.length) {
    console.log("Keine Merklisten vorhanden.");
    return;
  }

  const ids = lists.map(l => l.id);
  console.log(`Lösche ${ids.length} Merkliste(n) und deren Einträge…`);

  const { error: itemsErr } = await sb
    .from("wishlist_items")
    .delete()
    .in("wishlist_id", ids);
  if (itemsErr) console.error("wishlist_items:", itemsErr.message);
  else console.log("✓ wishlist_items gelöscht");

  const { error: listsErr } = await sb
    .from("wishlists")
    .delete()
    .in("id", ids);
  if (listsErr) console.error("wishlists:", listsErr.message);
  else console.log("✓ wishlists gelöscht");

  console.log("Fertig — Fall 1 ist jetzt aktiv.");
}

main().catch(console.error);
