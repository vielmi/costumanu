import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { FundusClient } from "@/components/fundus/fundus-client";
import type { Costume } from "@/lib/types/costume";

export default async function FundusPage() {
  const supabase = await createClient();

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ensure theater exists for user
  const { data: membership } = await supabase
    .from("theater_members")
    .select("theater_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  let theaterId: string;

  if (membership) {
    theaterId = membership.theater_id;
  } else {
    const slug = `personal-${user.id.slice(0, 8)}`;
    const { data: newTheaterId, error: bootstrapError } = await supabase.rpc(
      "bootstrap_personal_theater",
      { p_name: "Mein Fundus", p_slug: slug }
    );

    if (bootstrapError || !newTheaterId) {
      console.error("Bootstrap failed:", JSON.stringify(bootstrapError));
      return (
        <AppShell>
          <main className="mx-auto max-w-5xl px-4 py-8">
            <h1 className="text-xl font-bold text-destructive">Fehler beim Erstellen des Theaters</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Bitte versuche es später erneut oder kontaktiere den Support.
            </p>
          </main>
        </AppShell>
      );
    }

    theaterId = newTheaterId;
  }

  // Prefetch costumes with joined relations
  const { data: costumes } = await supabase
    .from("costumes")
    .select(`
      id, name, description, gender_term_id, clothing_type_id, created_at, theater_id,
      gender_term:taxonomy_terms!gender_term_id(id, vocabulary, label_de, parent_id, sort_order),
      clothing_type:taxonomy_terms!clothing_type_id(id, vocabulary, label_de, parent_id, sort_order),
      costume_media(id, costume_id, storage_path, sort_order, created_at),
      costume_provenance(id, costume_id, production_title, year, role_name),
      costume_items(id, costume_id, theater_id, barcode_id, size_label, condition_grade, current_status)
    `)
    .eq("theater_id", theaterId)
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <FundusClient
          initialCostumes={(costumes ?? []) as unknown as Costume[]}
          theaterId={theaterId}
        />
      </main>
    </AppShell>
  );
}
