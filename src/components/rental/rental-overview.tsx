"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Trash2, MapPin } from "lucide-react";
import { t } from "@/lib/i18n";

// ─── Types ───────────────────────────────────────────────────────────

interface CostumeData {
  id: string;
  name: string;
  theater_id: string;
  costume_media: { id: string; storage_path: string; sort_order: number }[];
  costume_provenance: { production_title: string; year: number | null }[];
  costume_items: { barcode_id: string }[];
  theater: { id: string; name: string; slug: string } | null;
}

interface CartItem {
  id: string;
  costume_id: string;
  added_at: string;
  costumes: CostumeData;
}

interface UserProfile {
  display_name: string;
  professional_title: string | null;
  phone: string | null;
}

interface RentalOverviewProps {
  initialCartItems: CartItem[];
  userId: string;
  userEmail: string;
  theaterId: string;
  theaterName: string;
  profile: UserProfile;
}

// ─── Component ───────────────────────────────────────────────────────

export function RentalOverview({
  initialCartItems,
  userId,
}: RentalOverviewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch cart items with React Query
  const { data: cartItems } = useQuery({
    queryKey: ["cart-items", userId],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .eq("user_id", userId)
        .order("added_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CartItem[];
    },
    initialData: initialCartItems,
  });

  // Delete cart item mutation
  const deleteMutation = useMutation({
    mutationFn: async (cartItemId: string) => {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", cartItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items", userId] });
    },
  });

  const itemCount = cartItems.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Heading with count */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t("rental.title")}
          {itemCount > 0 && (
            <span className="ml-2 text-lg font-normal text-muted-foreground">
              ({itemCount})
            </span>
          )}
        </h1>
      </div>

      {/* Cart items list or empty state */}
      {itemCount === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {cartItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onDelete={() => deleteMutation.mutate(item.id)}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>

          {/* Gold CTA button */}
          <Button
            className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
            size="lg"
            onClick={() => router.push("/rental/new")}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            {t("rental.createRental")}
          </Button>
        </>
      )}

      {deleteMutation.isError && (
        <p className="text-sm text-destructive">
          {t("common.error")}: {(deleteMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}

// ─── Cart Item Card ──────────────────────────────────────────────────

function CartItemCard({
  item,
  onDelete,
  isDeleting,
}: {
  item: CartItem;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const supabase = createClient();
  const costume = item.costumes;
  const firstMedia = costume.costume_media?.[0];
  const firstProvenance = costume.costume_provenance?.[0];
  const firstItem = costume.costume_items?.[0];

  // Fetch signed image URL
  const { data: imageUrl } = useQuery({
    queryKey: ["costume-image", firstMedia?.storage_path],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("costume-images")
        .createSignedUrl(firstMedia!.storage_path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!firstMedia,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return (
    <Card className="py-3">
      <CardContent className="flex items-center gap-4">
        {/* Thumbnail */}
        <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={costume.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10 text-[10px] text-muted-foreground">
              {t("results.noPhoto")}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {firstItem && (
            <span className="font-mono text-xs text-muted-foreground">
              {firstItem.barcode_id}
            </span>
          )}
          <h3 className="truncate text-sm font-semibold">{costume.name}</h3>
          {firstProvenance && (
            <p className="truncate text-xs text-muted-foreground">
              {firstProvenance.production_title}
              {firstProvenance.year ? ` (${firstProvenance.year})` : ""}
            </p>
          )}
          {costume.theater && (
            <div className="mt-0.5 flex items-center gap-1">
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <MapPin className="h-2.5 w-2.5" />
                {costume.theater.name}
              </Badge>
            </div>
          )}
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label={t("rental.removeFromCart")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
      <div>
        <p className="font-medium text-muted-foreground">
          {t("rental.emptyCart")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          {t("rental.emptyCartDescription")}
        </p>
      </div>
    </div>
  );
}
