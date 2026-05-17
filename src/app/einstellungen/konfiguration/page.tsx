import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { AppShell } from "@/components/layout/app-shell";
import { KonfigurationClient } from "@/components/einstellungen/konfiguration-client";
import { getTheaterLocations } from "@/lib/services/theater-location-service";

export const metadata: Metadata = { title: "Einstellungen" };

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check platform admin — use admin client to bypass RLS
  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  const isPlatformAdmin = profile?.platform_role === "platform_admin";

  // Load taxonomy terms via admin client (bypasses RLS)
  const { data: terms } = await admin
    .from("taxonomy_terms")
    .select("id, vocabulary, label_de, sort_order, parent_id")
    .order("vocabulary")
    .order("sort_order");

  // ── Platform Admin path ─────────────────────────────────────────────────────
  if (isPlatformAdmin) {
    const [
      { data: allTheaters },
      { data: allMembers },
      { data: allProfiles },
      {
        data: { users: authUsers },
      },
      { data: allNetworkMembers },
      { data: allNetworks },
    ] = await Promise.all([
      admin.from("theaters").select("id, name, slug, contact_name, contact_email").order("name"),
      admin.from("theater_members").select("user_id, theater_id, role"),
      admin.from("profiles").select("id, display_name, platform_role"),
      admin.auth.admin.listUsers(),
      admin.from("theater_network_members").select("network_id, theater_id, network_role"),
      admin.from("theater_networks").select("id, name, slug").order("name"),
    ]);

    const theaterMap = new Map((allTheaters ?? []).map((t) => [t.id, t.name]));

    const allMemberList = (allMembers ?? []).map((m) => {
      const p = allProfiles?.find((x) => x.id === m.user_id);
      const au = authUsers?.find((x) => x.id === m.user_id);
      const displayName =
        p?.display_name || au?.user_metadata?.full_name || au?.user_metadata?.name || "";
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
        isPlatformAdmin: p?.platform_role === "platform_admin",
      };
    });

    // Build networks with members
    const networks = (allNetworks ?? []).map((n) => ({
      id: n.id,
      name: n.name,
      slug: n.slug,
      members: (allNetworkMembers ?? [])
        .filter((m) => m.network_id === n.id)
        .map((m) => ({
          theater_id: m.theater_id,
          theater_name: theaterMap.get(m.theater_id) ?? m.theater_id,
          network_role: m.network_role as "member" | "admin",
        })),
    }));

    return (
      <AppShell>
        <KonfigurationClient
          isPlatformAdmin={true}
          theaterId=""
          terms={terms ?? []}
          members={[]}
          allTheaters={allTheaters ?? []}
          allMembers={allMemberList}
          fieldDefinitions={[]}
          networks={networks}
          subscriptionTier="enterprise"
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

  const memberIds = (members ?? []).map((m) => m.user_id);

  const [
    { data: profiles },
    {
      data: { users: authUsers },
    },
    { data: fieldDefs },
    { data: subscription },
    { data: theaterData },
    theaterLocations,
  ] = await Promise.all([
    supabase.from("profiles").select("id, display_name, platform_role").in("id", memberIds),
    admin.auth.admin.listUsers(),
    supabase
      .from("field_definitions")
      .select("id, label, field_type, options, is_required, sort_order")
      .eq("theater_id", theaterId)
      .order("sort_order"),
    supabase.from("subscriptions").select("tier").eq("theater_id", theaterId).maybeSingle(),
    admin
      .from("theaters")
      .select("name, address_info, contact_name, contact_email")
      .eq("id", theaterId)
      .single(),
    getTheaterLocations(supabase, theaterId),
  ]);

  const theaterUserIds = new Set((members ?? []).map((m) => m.user_id));
  const memberList = (members ?? [])
    .map((m) => {
      const p = profiles?.find((x) => x.id === m.user_id);
      const au = authUsers?.find((x) => x.id === m.user_id);
      const displayName =
        p?.display_name || au?.user_metadata?.full_name || au?.user_metadata?.name || "";
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
        isPlatformAdmin: p?.platform_role === "platform_admin",
      };
    })
    .filter((m) => theaterUserIds.has(m.userId));

  // ── Netzwerk-Admin: Netzwerke laden wo dieses Theater Admin ist ──────────────
  const { data: networkAdminships } = await supabase
    .from("theater_network_members")
    .select("network_id")
    .eq("theater_id", theaterId)
    .eq("network_role", "admin");

  let adminNetworks: import("@/components/einstellungen/konfiguration-client").AdminNetwork[] = [];

  if (networkAdminships?.length) {
    const networkIds = networkAdminships.map((n) => n.network_id);
    const [{ data: networkData }, { data: networkMemberData }] = await Promise.all([
      supabase
        .from("theater_networks")
        .select("id, name, slug, description, default_visibility")
        .in("id", networkIds),
      supabase
        .from("theater_network_members")
        .select("network_id, theater_id, network_role")
        .in("network_id", networkIds),
    ]);

    const memberTheaterIds = [...new Set((networkMemberData ?? []).map((m) => m.theater_id))];
    const { data: memberTheaterData } = await supabase
      .from("theaters")
      .select("id, name")
      .in("id", memberTheaterIds);

    const theaterNameMap = new Map((memberTheaterData ?? []).map((t) => [t.id, t.name]));

    adminNetworks = (networkData ?? []).map((n) => ({
      id: n.id,
      name: n.name,
      slug: n.slug,
      description: n.description ?? null,
      default_visibility: (n.default_visibility ?? "none") as "none" | "all",
      members: (networkMemberData ?? [])
        .filter((m) => m.network_id === n.id)
        .map((m) => ({
          theater_id: m.theater_id,
          theater_name: theaterNameMap.get(m.theater_id) ?? m.theater_id,
          network_role: m.network_role as "member" | "admin",
        })),
    }));
  }

  return (
    <AppShell>
      <KonfigurationClient
        isPlatformAdmin={false}
        theaterId={theaterId}
        terms={terms ?? []}
        members={memberList}
        allTheaters={[]}
        allMembers={[]}
        fieldDefinitions={
          (fieldDefs ?? []) as import("@/components/einstellungen/konfiguration-client").FieldDef[]
        }
        networks={[]}
        adminNetworks={adminNetworks}
        subscriptionTier={subscription?.tier ?? "free"}
        theaterName={theaterData?.name ?? ""}
        theaterAddressInfo={
          (theaterData?.address_info as {
            venue?: string;
            street?: string;
            zip?: string;
            city?: string;
          }) ?? {}
        }
        theaterContactName={theaterData?.contact_name ?? ""}
        theaterContactEmail={theaterData?.contact_email ?? ""}
        theaterLocations={theaterLocations}
      />
    </AppShell>
  );
}
