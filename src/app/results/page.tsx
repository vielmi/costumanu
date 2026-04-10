import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { FundusClient } from "@/components/fundus/fundus-client";
import { ScopeToggle } from "@/components/results/scope-toggle";
import type { Costume } from "@/lib/types/costume";

type SearchParams = Promise<{ scope?: string }>;

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { scope } = await searchParams;
  const isNetwork = scope === "network";

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Own theater
  const { data: membership } = await supabase
    .from("theater_members")
    .select("theater_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const theaterId: string = membership?.theater_id ?? "";

  // Network theaters (show_in_network = true)
  const { data: networkData } = await supabase
    .from("theaters")
    .select("id")
    .eq("settings->>show_in_network", "true");

  const networkTheaterIds = (networkData ?? []).map((t) => t.id);

  // Fetch costumes based on scope
  const queryIds = isNetwork ? networkTheaterIds : [theaterId];

  const { data: costumes } = queryIds.length > 0
    ? await supabase
        .from("costumes")
        .select(`
          id, name, description, gender_term_id, clothing_type_id, created_at, theater_id,
          gender_term:taxonomy_terms!gender_term_id(id, vocabulary, label_de, parent_id, sort_order),
          clothing_type:taxonomy_terms!clothing_type_id(id, vocabulary, label_de, parent_id, sort_order),
          costume_media(id, costume_id, storage_path, sort_order, created_at),
          costume_provenance(id, costume_id, production_title, year, role_name),
          costume_items(id, costume_id, theater_id, barcode_id, size_label, condition_grade, current_status)
        `)
        .in("theater_id", queryIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <ScopeToggle scope={isNetwork ? "network" : "own"} />
        <FundusClient
          initialCostumes={(costumes ?? []) as unknown as Costume[]}
          theaterId={theaterId}
          theaterIds={isNetwork ? networkTheaterIds : undefined}
          showAddButton={false}
        />
      </main>
    </AppShell>
  );
}
