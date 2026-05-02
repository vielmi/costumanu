import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WishlistPageClient } from "@/components/wishlist/wishlist-page-client";

export default async function MerklistePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ensure theater exists for user
  const { data: membership } = await supabase
    .from("theater_members")
    .select("theater_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

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
      theaterId = "";
    } else {
      theaterId = newTheaterId;
    }
  }

  // Fetch wishlists with item count and cover image
  const { data: wishlists } = await supabase
    .from("wishlists")
    .select(`
      id, name, is_archived, created_at, cover_image_path,
      wishlist_items(
        id,
        costumes(
          costume_media(storage_path, sort_order)
        )
      )
    `)
    .eq("owner_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  type ItemRow = {
    id: string;
    costumes: { costume_media: { storage_path: string; sort_order: number }[] } | null;
  };

  const mapped = (wishlists ?? []).map((w) => {
    // cover_image_path has priority over costume-derived cover
    let coverUrl: string | null = (w as unknown as { cover_image_path?: string }).cover_image_path ?? null;

    if (!coverUrl) {
      const items = (Array.isArray(w.wishlist_items) ? w.wishlist_items : []) as unknown as ItemRow[];
      for (const item of items) {
        const media = item.costumes?.costume_media;
        if (Array.isArray(media) && media.length > 0) {
          const sorted = [...media].sort((a, b) => a.sort_order - b.sort_order);
          coverUrl = `${supabaseUrl}/storage/v1/object/public/costume-media/${sorted[0].storage_path}`;
          break;
        }
      }
    }

    const items = (Array.isArray(w.wishlist_items) ? w.wishlist_items : []) as unknown as ItemRow[];
    return {
      id: w.id,
      name: w.name,
      is_archived: w.is_archived,
      created_at: w.created_at,
      item_count: items.length,
      coverUrl,
    };
  });

  return (
    <WishlistPageClient
      wishlists={mapped}
      theaterId={theaterId}
      userId={user.id}
    />
  );
}
