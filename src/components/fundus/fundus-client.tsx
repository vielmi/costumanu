"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import type { Costume } from "@/lib/types/costume";

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
        <h1 className="text-2xl font-bold">Mein Fundus</h1>
        <Button asChild>
          <Link href="/fundus/neu">
            <Plus className="mr-2 h-4 w-4" />
            Kostüm hinzufügen
          </Link>
        </Button>
      </div>

      {costumes.length === 0 ? (
        <p className="text-muted-foreground">
          Noch keine Kostüme vorhanden.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
  });

  return (
    <Card className="overflow-hidden py-0">
      <div className="flex">
        <div className="relative h-40 w-32 shrink-0 bg-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={costume.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Kein Foto
            </div>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col justify-center gap-2 p-4">
          <h3 className="font-semibold leading-tight">{costume.name}</h3>
          {firstProvenance && (
            <p className="text-sm text-muted-foreground">
              {firstProvenance.production_title}
              {firstProvenance.year ? ` (${firstProvenance.year})` : ""}
            </p>
          )}
          {costume.clothing_type && (
            <Badge variant="secondary" className="w-fit">
              {costume.clothing_type.label_de}
            </Badge>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
