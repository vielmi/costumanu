import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WishlistDetailClient } from "@/components/wishlist/wishlist-detail-client";

export type WishlistCostume = {
  itemId: string;
  id: string;
  shortId: string;
  name: string;
  clothingTypeLabel: string | null;
  imageUrl: string | null;
  storageLocation: string | null;
  status: string | null;
  theaterName: string | null;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("wishlists").select("name").eq("id", id).single();
  return { title: data?.name ?? "Merkliste" };
}

export default async function WishlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id, name")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!wishlist) notFound();

  const { data: rawItems } = await supabase
    .from("wishlist_items")
    .select(
      `
      id,
      costumes(
        id, name,
        clothing_type:taxonomy_terms!clothing_type_id(label_de),
        costume_media(storage_path, sort_order),
        costume_items(current_status, storage_location_path),
        theater:theaters(name)
      )
    `
    )
    .eq("wishlist_id", id);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  type RawRow = {
    id: string;
    costumes: {
      id: string;
      name: string;
      clothing_type: { label_de: string } | null;
      costume_media: { storage_path: string; sort_order: number }[];
      costume_items: { current_status: string | null; storage_location_path: string | null }[];
      theater: { name: string } | null;
    } | null;
  };
  const costumes: WishlistCostume[] = ((rawItems as unknown as RawRow[]) ?? [])
    .map((row) => {
      const c = row.costumes;
      if (!c) return null;

      const media: { storage_path: string; sort_order: number }[] = Array.isArray(c.costume_media)
        ? c.costume_media
        : [];
      const sorted = [...media].sort((a, b) => a.sort_order - b.sort_order);
      const imageUrl = sorted[0]
        ? `${supabaseUrl}/storage/v1/object/public/costume-images/${sorted[0].storage_path}`
        : null;

      const items: { current_status: string | null; storage_location_path: string | null }[] =
        Array.isArray(c.costume_items) ? c.costume_items : [];
      const status = items[0]?.current_status ?? null;
      const storageLocation = items[0]?.storage_location_path ?? null;

      const clothingType = c.clothing_type;
      const theaterRow = c.theater;

      return {
        itemId: row.id,
        id: c.id,
        shortId: `ID-${(c.id as string).replace(/-/g, "").slice(0, 9).toUpperCase()}`,
        name: c.name,
        clothingTypeLabel: clothingType?.label_de ?? null,
        imageUrl,
        storageLocation,
        status,
        theaterName: theaterRow?.name ?? null,
      };
    })
    .filter(Boolean) as WishlistCostume[];

  return (
    <WishlistDetailClient
      wishlistId={wishlist.id}
      wishlistName={wishlist.name}
      costumes={costumes}
    />
  );
}
