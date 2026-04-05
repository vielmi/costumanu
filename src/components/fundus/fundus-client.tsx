"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Archive } from "lucide-react";
import type { Costume } from "@/lib/types/costume";
import { t } from "@/lib/i18n";

interface FundusClientProps {
  initialCostumes: Costume[];
  theaterId: string;
}

export function FundusClient({ initialCostumes, theaterId }: FundusClientProps) {
  const supabase = createClient();

  const { data: costumes } = useQuery({
    queryKey: ["costumes", theaterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("costumes")
        .select(`
          id, name, description, gender_term_id, clothing_type_id, created_at, theater_id,
          gender_term:taxonomy_terms!gender_term_id(id, vocabulary, label_de, parent_id, sort_order),
          clothing_type:taxonomy_terms!clothing_type_id(id, vocabulary, label_de, parent_id, sort_order),
          costume_media(id, costume_id, storage_path, sort_order, created_at),
          costume_provenance(id, costume_id, production_title, year, role_name),
          costume_items(id, costume_id, theater_id, barcode_id, size_label, condition_grade, current_status)
        `)
        .eq("theater_id", theaterId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Costume[];
    },
    initialData: initialCostumes,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("inventory.title")}</h1>
        <Button asChild>
          <Link href="/fundus/neu">
            <Plus className="mr-2 h-4 w-4" />
            {t("inventory.addCostume")}
          </Link>
        </Button>
      </div>

      {costumes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
          <Archive className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-medium">{t("inventory.noCostumes")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("inventory.noCostumesDescription")}
            </p>
          </div>
          <Button asChild>
            <Link href="/fundus/neu">
              <Plus className="mr-2 h-4 w-4" />
              {t("inventory.createFirst")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {costumes.map((costume) => (
            <CostumeCard key={costume.id} costume={costume} />
          ))}
        </div>
      )}
    </div>
  );
}

function CostumeCard({ costume }: { costume: Costume }) {
  const supabase = createClient();
  const firstMedia = costume.costume_media?.[0];
  const firstProvenance = costume.costume_provenance?.[0];

  const imageUrl = firstMedia
    ? supabase.storage.from("costume-images").getPublicUrl(firstMedia.storage_path).data.publicUrl
    : null;

  return (
    <Link
      href={`/costume/${costume.id}`}
      className="group overflow-hidden rounded-xl border bg-card text-card-foreground transition-colors hover:bg-accent"
    >
      <div className="relative aspect-[3/4] w-full bg-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={costume.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            {t("inventory.noPhoto")}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="text-sm font-semibold leading-tight">{costume.name}</h3>
        {firstProvenance && (
          <p className="text-xs text-muted-foreground">
            {firstProvenance.production_title}
            {firstProvenance.year ? ` (${firstProvenance.year})` : ""}
          </p>
        )}
        {costume.clothing_type && (
          <Badge variant="secondary" className="mt-1 w-fit text-xs">
            {costume.clothing_type.label_de}
          </Badge>
        )}
      </div>
    </Link>
  );
}
