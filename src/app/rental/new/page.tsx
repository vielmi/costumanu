import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { RentalWizard } from "@/components/rental/rental-wizard";

export default async function AusleiheNeuPage() {
  const supabase = await createClient();

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ensure theater membership
  const { data: membership } = await supabase
    .from("theater_members")
    .select("theater_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    redirect("/rental");
  }

  const theaterId = membership.theater_id;

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, professional_title, phone")
    .eq("id", user.id)
    .single();

  // Fetch theater name
  const { data: theater } = await supabase
    .from("theaters")
    .select("name")
    .eq("id", theaterId)
    .single();

  // Prefetch cart items for the wizard
  const { data: cartItems } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      costume_id,
      added_at,
      costumes:costume_id (
        id,
        name,
        theater_id,
        costume_media (id, storage_path, sort_order),
        costume_provenance (production_title, year),
        costume_items (barcode_id),
        theater:theater_id (id, name, slug)
      )
    `
    )
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  return (
    <div style={{ minHeight: "100vh", background: "var(--page-bg)" }}>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <RentalWizard
          userId={user.id}
          userEmail={user.email ?? ""}
          theaterId={theaterId}
          theaterName={theater?.name ?? ""}
          profile={profile ?? { display_name: "", professional_title: null, phone: null }}
          initialCartItems={(cartItems ?? []) as unknown as Parameters<typeof RentalWizard>[0]["initialCartItems"]}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
