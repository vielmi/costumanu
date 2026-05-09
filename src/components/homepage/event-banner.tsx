import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";

type EventData = {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  image_storage_path: string | null;
  theater_id: string | null;
};

type EventBannerProps = {
  event: EventData;
};

export function EventBanner({ event }: EventBannerProps) {
  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString("de-CH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <div className="bg-surface-dark text-surface-dark-foreground relative overflow-hidden rounded-xl">
        {/* Placeholder image background */}
        <div className="from-surface-dark to-surface-dark/80 absolute inset-0 bg-gradient-to-br" />

        <div className="relative p-6">
          {formattedDate && (
            <Badge className="bg-gold text-gold-foreground hover:bg-gold/90 mb-3">
              <CalendarDays className="mr-1.5 h-3 w-3" />
              {formattedDate}
            </Badge>
          )}

          <h2 className="text-xl font-bold">{event.title}</h2>

          {event.description && (
            <p className="text-surface-dark-foreground/70 mt-3 text-sm">{event.description}</p>
          )}
        </div>
      </div>
    </section>
  );
}
