import { genderCategories } from "@/lib/constants/homepage-data";

export function GenderGrid() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {genderCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              type="button"
              key={cat.label}
              aria-label={`${cat.label} – ${cat.count.toLocaleString("de-CH")} Kostüme`}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-card-foreground transition-colors hover:bg-accent"
            >
              <Icon className="h-7 w-7" />
              <span className="text-sm font-medium">{cat.label}</span>
              <span className="text-xs text-muted-foreground">
                {cat.count.toLocaleString("de-CH")}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
