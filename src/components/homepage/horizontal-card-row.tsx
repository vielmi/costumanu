import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type CardItem = {
  label: string;
  image: string;
  subtitle?: string;
};

type HorizontalCardRowProps = {
  title: string;
  items: CardItem[];
};

export function HorizontalCardRow({ title, items }: HorizontalCardRowProps) {
  return (
    <section className="py-6">
      <h2 className="mx-auto mb-4 max-w-5xl px-4 text-lg font-bold">{title}</h2>

      <ScrollArea className="w-full">
        <div className="mx-auto flex max-w-5xl gap-3 px-4 pb-4">
          {items.map((item) => (
            <button
              type="button"
              key={item.label}
              aria-label={`${item.label} anzeigen`}
              className="group flex-shrink-0"
            >
              <div className="h-32 w-28 overflow-hidden rounded-xl bg-gradient-to-br from-muted to-muted-foreground/10 md:h-40 md:w-36">
                {/* Placeholder for image */}
              </div>
              <p className="mt-2 text-center text-sm font-medium">{item.label}</p>
              {item.subtitle && (
                <p className="text-center text-xs text-muted-foreground">
                  {item.subtitle}
                </p>
              )}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
