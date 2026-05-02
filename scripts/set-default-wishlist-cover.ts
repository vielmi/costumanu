import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_COVER = "/images/wishlist-default.svg";
const TEST_EMAIL = "manuela.vielmi@gmail.com";

async function main() {
  const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) { console.error("listUsers:", userErr); process.exit(1); }

  const user = users.find((u) => u.email === TEST_EMAIL);
  if (!user) { console.error("User not found:", TEST_EMAIL); process.exit(1); }

  const { data, error } = await supabase
    .from("wishlists")
    .update({ cover_image_path: DEFAULT_COVER })
    .eq("owner_id", user.id)
    .select("id, name");

  if (error) { console.error("update:", error); process.exit(1); }

  console.log(`✓ Default cover set on ${data?.length ?? 0} wishlist(s):`);
  data?.forEach((w) => console.log(`  - ${w.name} (${w.id})`));
}

main();
