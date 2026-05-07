"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { t } from "@/lib/i18n";
import type { Costume } from "@/lib/types/costume";

type SimilarCostumesProps = {
  costumes: Costume[];
};

export function SimilarCostumes({ costumes }: SimilarCostumesProps) {
  const isMobile = useIsMobile();
  const pad = isMobile ? "0 16px 32px" : "0 32px 32px";

  return (
    <section style={{ padding: pad }}>
      <div style={isMobile ? {} : { maxWidth: 560, margin: "0 auto" }}>
        <h2 className="mb-3 text-lg font-bold">{t("costume.similarCostumes")}</h2>
      </div>
      <ScrollArea className="w-full">
        <div style={isMobile ? {} : { maxWidth: 560, margin: "0 auto" }}>
          <div className="flex gap-3 pb-4">
            {costumes.map((costume) => (
              <SimilarCostumeCard key={costume.id} costume={costume} />
            ))}
          </div>
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

  const imageUrl = firstMedia
    ? supabase.storage.from("costume-images").getPublicUrl(firstMedia.storage_path).data.publicUrl
    : null;

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
