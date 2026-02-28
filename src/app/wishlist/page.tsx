import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MerklisteClient } from "@/components/wishlist/merkliste-client";
import { t } from "@/lib/i18n";

export default async function MerklistePage() {
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
    // We use an RPC to avoid the chicken-and-egg RLS problem:
    // the INSERT succeeds but the RETURNING/SELECT is blocked because
    // the user isn't a member yet.
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
            <h1 className="text-xl font-bold text-destructive">{t("inventory.errorTitle")}</h1>
            <p className="mt-4 text-sm text-muted-foreground">{t("inventory.errorDescription")}</p>
          </main>
          <SiteFooter />
        </div>
      );
    }

    theaterId = newTheaterId;
  }

  // Prefetch wishlists
  const { data: wishlists } = await supabase
    .from("wishlists")
    .select("id, name, is_archived, created_at")
    .eq("owner_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <MerklisteClient
          initialWishlists={(wishlists ?? []).map(w => ({ ...w, item_count: 0 }))}
          theaterId={theaterId}
          userId={user.id}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
