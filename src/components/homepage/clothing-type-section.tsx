import { clothingTypes } from "@/lib/constants/homepage-data";
import { Badge } from "@/components/ui/badge";

export function ClothingTypeSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <h2 className="mb-4 text-lg font-bold">Bekleidungsart</h2>
      <div className="grid grid-cols-2 gap-4">
        {clothingTypes.map((item) => (
          <div
            key={item.label}
            className="group relative overflow-hidden rounded-xl bg-muted"
          >
            {/* Placeholder image area */}
            <div className="aspect-[3/4] w-full bg-gradient-to-br from-muted to-muted-foreground/10" />

            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4">
              <h3 className="mb-2 text-lg font-bold text-white">{item.label}</h3>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="bg-chip text-chip-foreground hover:bg-chip/90"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
