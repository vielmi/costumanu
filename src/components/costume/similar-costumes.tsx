"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { t } from "@/lib/i18n";
import type { Costume } from "@/lib/types/costume";

type SimilarCostumesProps = {
  costumes: Costume[];
};

export function SimilarCostumes({ costumes }: SimilarCostumesProps) {
  return (
    <section className="py-2">
      <h2 className="mb-3 px-4 text-lg font-bold">{t("costume.similarCostumes")}</h2>
      <ScrollArea className="w-full">
        <div className="flex gap-3 px-4 pb-4">
          {costumes.map((costume) => (
            <SimilarCostumeCard key={costume.id} costume={costume} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}

function SimilarCostumeCard({ costume }: { costume: Costume }) {
  const supabase = createClient();
  const firstMedia = costume.costume_media?.[0];
  const firstProvenance = costume.costume_provenance?.[0];

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
    <Link href={`/costume/${costume.id}`} className="flex-shrink-0">
      <div className="h-40 w-28 overflow-hidden rounded-xl bg-muted md:h-48 md:w-36">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={costume.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
        )}
      </div>
      <p className="mt-2 max-w-28 text-sm font-medium leading-tight md:max-w-36">
        {costume.name}
      </p>
      {firstProvenance && (
        <p className="max-w-28 text-xs text-muted-foreground md:max-w-36">
          {firstProvenance.production_title}
          {firstProvenance.year ? ` (${firstProvenance.year})` : ""}
        </p>
      )}
    </Link>
  );
}
