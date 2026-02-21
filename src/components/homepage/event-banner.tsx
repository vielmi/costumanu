import { featuredEvent } from "@/lib/constants/homepage-data";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin } from "lucide-react";

export function EventBanner() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <div className="relative overflow-hidden rounded-xl bg-surface-dark text-surface-dark-foreground">
        {/* Placeholder image background */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-dark to-surface-dark/80" />

        <div className="relative p-6">
          <Badge className="mb-3 bg-gold text-gold-foreground hover:bg-gold/90">
            <CalendarDays className="mr-1.5 h-3 w-3" />
            {featuredEvent.date}
          </Badge>

          <h2 className="text-xl font-bold">{featuredEvent.title}</h2>
          <p className="text-lg font-medium text-surface-dark-foreground/80">
            {featuredEvent.subtitle}
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-sm text-surface-dark-foreground/60">
            <MapPin className="h-3.5 w-3.5" />
            {featuredEvent.location}
          </div>

          <p className="mt-3 text-sm text-surface-dark-foreground/70">
            {featuredEvent.description}
          </p>
        </div>
      </div>
    </section>
  );
}
