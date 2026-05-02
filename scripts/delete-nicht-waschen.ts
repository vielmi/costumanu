/**
 * Löscht den Taxonomy-Term "Nicht waschen" (washing_type) aus der DB.
 * Run: npx tsx scripts/delete-nicht-waschen.ts
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

async function main() {
  const { data: term, error: findErr } = await sb
    .from("taxonomy_terms")
    .select("id")
    .eq("vocabulary", "washing_type")
    .eq("label_de", "Nicht waschen")
    .single();

  if (findErr || !term) {
    console.log("Term 'Nicht waschen' nicht gefunden – möglicherweise bereits gelöscht.");
    return;
  }

  console.log(`Term gefunden: ${term.id}`);

  const { count, error: refErr } = await sb
    .from("costume_taxonomy")
    .select("*", { count: "exact", head: true })
    .eq("term_id", term.id);

  if (refErr) { console.error("Fehler beim Prüfen der Referenzen:", refErr.message); return; }
  console.log(`Referenzen in costume_taxonomy: ${count}`);

  if (count && count > 0) {
    const { error: delRefErr } = await sb
      .from("costume_taxonomy")
      .delete()
      .eq("term_id", term.id);
    if (delRefErr) { console.error("Fehler beim Löschen der Referenzen:", delRefErr.message); return; }
    console.log(`✓ ${count} Referenzen gelöscht`);
  }

  const { error: delErr } = await sb
    .from("taxonomy_terms")
    .delete()
    .eq("id", term.id);

  if (delErr) { console.error("Fehler beim Löschen des Terms:", delErr.message); return; }
  console.log("✓ Term 'Nicht waschen' gelöscht");
}

main().catch(console.error);
