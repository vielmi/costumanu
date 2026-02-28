import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { RentalOverview } from "@/components/rental/rental-overview";
import { t } from "@/lib/i18n";

export default async function AusleihePage() {
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
    // Bootstrap personal theater + membership in one go.
    const slug = `personal-${user.id.slice(0, 8)}`;
    const { data: newTheaterId, error: bootstrapError } = await supabase.rpc(
      "bootstrap_personal_theater",
      { p_name: "Mein Fundus", p_slug: slug }
    );

    if (bootstrapError || !newTheaterId) {
      console.error("Bootstrap failed:", JSON.stringify(bootstrapError));
      return (
        <div className="min-h-screen bg-background text-foreground">
          <SiteHeader />
          <main className="mx-auto max-w-5xl px-4 py-8">
            <h1 className="text-xl font-bold text-destructive">
              {t("inventory.errorTitle")}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              {t("inventory.errorDescription")}
            </p>
          </main>
          <SiteFooter />
        </div>
      );
    }

    theaterId = newTheaterId;
  }

  // Prefetch cart items with joined costume + media + theater data
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

  // Fetch user profile for the wizard
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <RentalOverview
          initialCartItems={(cartItems ?? []) as unknown as Parameters<typeof RentalOverview>[0]["initialCartItems"]}
          userId={user.id}
          userEmail={user.email ?? ""}
          theaterId={theaterId}
          theaterName={theater?.name ?? ""}
          profile={profile ?? { display_name: "", professional_title: null, phone: null }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
