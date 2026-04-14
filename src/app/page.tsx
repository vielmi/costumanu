import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CockpitShell } from "@/components/cockpit/cockpit-shell";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("theater_members")
    .select("theater_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const theaterId: string | null = membership?.theater_id ?? null;
  const userRole: string = membership?.role ?? "member";

  if (userRole === "viewer") {
    redirect("/suchmodus");
  }

  // Fetch recent costumes + provenance for production column
  const { data: rawCostumes } = theaterId
    ? await supabase
        .from("costumes")
        .select(`
          id, name, created_at,
          gender_term:taxonomy_terms!gender_term_id(id, label_de),
          clothing_type:taxonomy_terms!clothing_type_id(id, label_de),
          costume_media(storage_path, sort_order),
          costume_items(current_status),
          costume_provenance(production_title, year)
        `)
        .eq("theater_id", theaterId)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentCostumes = (rawCostumes ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    created_at: c.created_at,
    gender_term: Array.isArray(c.gender_term) ? (c.gender_term[0] ?? null) : c.gender_term,
    clothing_type: Array.isArray(c.clothing_type) ? (c.clothing_type[0] ?? null) : c.clothing_type,
    costume_media: c.costume_media ?? [],
    costume_items: c.costume_items ?? [],
    costume_provenance: c.costume_provenance ?? [],
  }));

  // Badge: pending rental requests (user's theater is lender)
  const { count: pendingRentals } = theaterId
    ? await supabase
        .from("rental_orders")
        .select("id", { count: "exact", head: true })
        .eq("lender_theater_id", theaterId)
        .eq("status", "requested")
        .neq("borrower_user_id", user.id)
    : { count: 0 };

  // Badge: unread messages
  const { data: participations } = await supabase
    .from("chat_thread_participants")
    .select("thread_id, last_read_at")
    .eq("user_id", user.id);

  let unreadMessages = 0;
  if (participations?.length) {
    const results = await Promise.all(
      participations.map((p) =>
        supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("thread_id", p.thread_id)
          .neq("sender_id", user.id)
          .gt("created_at", p.last_read_at ?? "1970-01-01T00:00:00Z")
      )
    );
    unreadMessages = results.reduce((sum, r) => sum + (r.count ?? 0), 0);
  }

  return (
    <CockpitShell
      recentCostumes={recentCostumes}
      theaterId={theaterId}
      unreadMessages={unreadMessages}
      pendingRentals={pendingRentals ?? 0}
      userRole={userRole}
    />
  );
}
