import Link from "next/link";
import type { TaxonomyTerm } from "@/lib/types/costume";
import { Badge } from "@/components/ui/badge";

type ClothingTypeSectionProps = {
  clothingTypes: TaxonomyTerm[];
  subTypesByParent: Record<string, TaxonomyTerm[]>;
};

export function ClothingTypeSection({
  clothingTypes,
  subTypesByParent,
}: ClothingTypeSectionProps) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <h2 className="mb-4 text-lg font-bold">Bekleidungsart</h2>
      <div className="grid grid-cols-2 gap-4">
        {clothingTypes.map((item) => {
          const subTypes = subTypesByParent[item.id] ?? [];
          return (
            <Link
              key={item.id}
              href={`/results?clothing_type=${item.id}`}
              className="group relative overflow-hidden rounded-xl bg-muted"
            >
              {/* Placeholder image area */}
              <div className="aspect-[3/4] w-full bg-gradient-to-br from-muted to-muted-foreground/10" />

              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4">
                <h3 className="mb-2 text-lg font-bold text-white">
                  {item.label_de}
                </h3>
                {subTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {subTypes.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag.id}
                        className="bg-chip text-chip-foreground hover:bg-chip/90"
                      >
                        {tag.label_de}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
