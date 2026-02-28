import Link from "next/link";
import type { TaxonomyTerm } from "@/lib/types/costume";
import {
  User,
  Users,
  Baby,
  Dog,
  Sparkles,
  PersonStanding,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const genderIcons: Record<string, LucideIcon> = {
  Damen: User,
  Herren: PersonStanding,
  Unisex: Users,
  Kinder: Baby,
  Tier: Dog,
  Fantasy: Sparkles,
};

type GenderGridProps = {
  genders: TaxonomyTerm[];
};

export function GenderGrid({ genders }: GenderGridProps) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {genders.map((gender) => {
          const Icon = genderIcons[gender.label_de] ?? User;
          return (
            <Link
              key={gender.id}
              href={`/ergebnisse?gender=${gender.id}`}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-card-foreground transition-colors hover:bg-accent"
            >
              <Icon className="h-7 w-7" />
              <span className="text-sm font-medium">{gender.label_de}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
