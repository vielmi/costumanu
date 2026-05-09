"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";

type CostumeCardProps = {
  costume: {
    id: string;
    name: string;
    costume_media?: { id: string; storage_path: string; sort_order: number }[];
    costume_provenance?: { production_title: string; year: number | null }[];
    theater?: { id: string; name: string; slug: string } | null;
    [key: string]: unknown;
  };
};

export function CostumeCard({ costume }: CostumeCardProps) {
  const supabase = createClient();
  const firstMedia = costume.costume_media?.[0];
  const firstProvenance = costume.costume_provenance?.[0];

  const imageUrl = firstMedia
    ? supabase.storage.from("costume-images").getPublicUrl(firstMedia.storage_path).data.publicUrl
    : null;

  return (
    <div className="group relative">
      <Link
        href={`/costume/${costume.id}`}
        className="bg-card text-card-foreground hover:bg-accent block overflow-hidden rounded-xl border transition-colors"
      >
        {/* Image */}
        <div className="bg-muted relative aspect-[3/4] w-full">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={costume.name} className="h-full w-full object-cover" />
          ) : (
            <div className="from-muted to-muted-foreground/10 text-muted-foreground flex h-full w-full items-center justify-center bg-gradient-to-br text-xs">
              Kein Foto
            </div>
          )}
        </div>

        {/* Text content */}
        <div className="flex flex-col gap-1 p-3">
          <h3 className="text-sm leading-tight font-semibold">{costume.name}</h3>
          {firstProvenance && (
            <p className="text-muted-foreground text-xs">
              {firstProvenance.production_title}
              {firstProvenance.year ? ` (${firstProvenance.year})` : ""}
            </p>
          )}
          {costume.theater && (
            <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              <span>{costume.theater.name}</span>
            </div>
          )}
        </div>
      </Link>

      {/* "+" button overlay */}
      <Button
        size="icon"
        variant="secondary"
        className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 shadow-md transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // TODO: Phase 4 — open "Add to Merkliste" sheet
        }}
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">Zur Merkliste hinzufügen</span>
      </Button>
    </div>
  );
}
