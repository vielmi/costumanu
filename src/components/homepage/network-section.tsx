import Link from "next/link";

type Theater = {
  id: string;
  name: string;
  slug: string;
};

type NetworkSectionProps = {
  theaters: Theater[];
};

export function NetworkSection({ theaters }: NetworkSectionProps) {
  if (theaters.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <h2 className="mb-4 text-lg font-bold">Kostüm Netzwerk</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Partner-Theater und Fundus in der Schweiz
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {theaters.map((theater) => (
          <Link
            key={theater.id}
            href={`/results?theater=${theater.id}`}
            className="bg-card text-card-foreground hover:bg-accent flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors"
          >
            {/* Initials avatar placeholder */}
            <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full text-xs font-bold">
              {theater.name
                .split(" ")
                .filter(Boolean)
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <span className="text-center text-xs font-medium">{theater.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
