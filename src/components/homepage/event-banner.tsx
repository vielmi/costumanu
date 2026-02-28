import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin } from "lucide-react";

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
      <div className="relative overflow-hidden rounded-xl bg-surface-dark text-surface-dark-foreground">
        {/* Placeholder image background */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-dark to-surface-dark/80" />

        <div className="relative p-6">
          {formattedDate && (
            <Badge className="mb-3 bg-gold text-gold-foreground hover:bg-gold/90">
              <CalendarDays className="mr-1.5 h-3 w-3" />
              {formattedDate}
            </Badge>
          )}

          <h2 className="text-xl font-bold">{event.title}</h2>

          {event.description && (
            <p className="mt-3 text-sm text-surface-dark-foreground/70">
              {event.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
