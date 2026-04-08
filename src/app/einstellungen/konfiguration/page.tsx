import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { AppShell } from "@/components/layout/app-shell";
import { KonfigurationClient } from "@/components/einstellungen/konfiguration-client";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function KonfigurationPage() {
  const supabase = await createClient();
  const admin = getAdmin();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check platform admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  const isPlatformAdmin = profile?.platform_role === "platform_admin";

  // Load taxonomy terms (same for both roles)
  const { data: terms } = await supabase
    .from("taxonomy_terms")
    .select("id, vocabulary, label_de, sort_order, theater_id")
    .order("vocabulary")
    .order("sort_order");

  // ── Platform Admin path ─────────────────────────────────────────────────────
  if (isPlatformAdmin) {
    const [
      { data: allTheaters },
      { data: allMembers },
      { data: allProfiles },
      { data: { users: authUsers } },
    ] = await Promise.all([
      admin.from("theaters").select("id, name, slug").order("name"),
      admin.from("theater_members").select("user_id, theater_id, role"),
      admin.from("profiles").select("id, display_name"),
      admin.auth.admin.listUsers(),
    ]);

    const theaterMap = new Map((allTheaters ?? []).map((t) => [t.id, t.name]));

    const allMemberList = (allMembers ?? []).map((m) => {
      const p = allProfiles?.find((x) => x.id === m.user_id);
      const au = authUsers?.find((x) => x.id === m.user_id);
      const displayName = p?.display_name ?? "";
      const parts = displayName.split(" ");
      return {
        userId: m.user_id,
        email: au?.email ?? "",
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" "),
        role: m.role,
        isSelf: m.user_id === user.id,
        theaterName: theaterMap.get(m.theater_id) ?? "",
        theaterId: m.theater_id,
      };
    });

    return (
      <AppShell>
        <KonfigurationClient
          isPlatformAdmin={true}
          theaterId=""
          terms={terms ?? []}
          members={[]}
          allTheaters={allTheaters ?? []}
          allMembers={allMemberList}
        />
      </AppShell>
    );
  }

  // ── Theater Admin path ──────────────────────────────────────────────────────
  const { data: membership } = await supabase
    .from("theater_members")
    .select("theater_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    redirect("/");
  }

  const theaterId = membership.theater_id;

  const { data: members } = await supabase
    .from("theater_members")
    .select("user_id, role")
    .eq("theater_id", theaterId);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", (members ?? []).map((m) => m.user_id));

  const { data: { users: authUsers } } = await admin.auth.admin.listUsers();

  const theaterUserIds = new Set((members ?? []).map((m) => m.user_id));
  const memberList = (members ?? []).map((m) => {
    const p = profiles?.find((x) => x.id === m.user_id);
    const au = authUsers?.find((x) => x.id === m.user_id);
    const displayName = p?.display_name ?? "";
    const parts = displayName.split(" ");
    return {
      userId: m.user_id,
      email: au?.email ?? "",
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
      role: m.role,
      isSelf: m.user_id === user.id,
      theaterName: "",
      theaterId,
    };
  }).filter((m) => theaterUserIds.has(m.userId));

  return (
    <AppShell>
      <KonfigurationClient
        isPlatformAdmin={false}
        theaterId={theaterId}
        terms={terms ?? []}
        members={memberList}
        allTheaters={[]}
        allMembers={[]}
      />
    </AppShell>
  );
}
