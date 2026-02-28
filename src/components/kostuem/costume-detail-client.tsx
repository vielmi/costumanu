"use client";

import Link from "next/link";
import { ArrowLeft, Share2, Heart, ShoppingBag, MapPin, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageCarousel } from "@/components/kostuem/image-carousel";
import { CostumeSpecs } from "@/components/kostuem/costume-specs";
import { SimilarCostumes } from "@/components/kostuem/similar-costumes";
import type { Costume, TaxonomyTerm } from "@/lib/types/costume";

type CostumeDetailClientProps = {
  costume: Costume;
  taxonomyByVocabulary: Record<string, TaxonomyTerm[]>;
  children: Costume[];
  similarCostumes: Costume[];
};

export function CostumeDetailClient({
  costume,
  taxonomyByVocabulary,
  children,
  similarCostumes,
}: CostumeDetailClientProps) {
  const firstItem = costume.costume_items?.[0];
  const firstProvenance = costume.costume_provenance?.[0];

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Breadcrumbs */}
      <div className="px-4 pt-4">
        <Link
          href="/ergebnisse"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          {costume.gender_term && (
            <>
              <Link
                href={`/ergebnisse?gender=${costume.gender_term.id}`}
                className="hover:underline"
              >
                {costume.gender_term.label_de}
              </Link>
              <span>&rsaquo;</span>
            </>
          )}
          {costume.clothing_type && (
            <>
              <Link
                href={`/ergebnisse?clothing_type=${costume.clothing_type.id}`}
                className="hover:underline"
              >
                {costume.clothing_type.label_de}
              </Link>
              <span>&rsaquo;</span>
            </>
          )}
          <span className="text-foreground">{costume.name}</span>
        </div>
      </div>

      {/* Image Carousel */}
      <ImageCarousel media={costume.costume_media ?? []} name={costume.name} />

      {/* Title Block */}
      <div className="px-4">
        {costume.clothing_type && (
          <Badge variant="secondary" className="mb-2">
            {costume.clothing_type.label_de}
          </Badge>
        )}
        <h1 className="text-2xl font-bold">{costume.name}</h1>
        {firstItem?.size_label && (
          <p className="mt-1 text-sm text-muted-foreground">
            Konfektionsgrösse {firstItem.size_label}
          </p>
        )}
      </div>

      {/* Description */}
      {costume.description && (
        <div className="px-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {costume.description}
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2 px-4">
        {costume.gender_term && (
          <Badge variant="outline">{costume.gender_term.label_de}</Badge>
        )}
        {costume.is_ensemble && <Badge variant="outline">Mehrteilig</Badge>}
        {costume.is_ensemble && <Badge variant="outline">Serie</Badge>}
        {(taxonomyByVocabulary["epoche"] ?? []).map((t) => (
          <Badge key={t.id} variant="outline">
            {t.label_de}
          </Badge>
        ))}
      </div>

      {/* Theater Badge */}
      {costume.theater && (
        <div className="px-4">
          <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{costume.theater.name}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 px-4">
        <Button className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90">
          <ShoppingBag className="mr-2 h-4 w-4" />
          Ausleihen
        </Button>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Teilen</span>
        </Button>
        <Button variant="outline" size="icon">
          <Heart className="h-4 w-4" />
          <span className="sr-only">Merken</span>
        </Button>
      </div>

      {/* Costume Specifications */}
      <CostumeSpecs
        costume={costume}
        taxonomyByVocabulary={taxonomyByVocabulary}
        firstItem={firstItem ?? null}
        firstProvenance={firstProvenance ?? null}
      />

      {/* Standort */}
      {(costume.theater || firstItem?.storage_location_path) && (
        <section className="px-4">
          <h2 className="mb-3 text-lg font-bold">Standort</h2>
          {costume.theater && (
            <p className="text-sm font-medium">{costume.theater.name}</p>
          )}
          {firstItem?.storage_location_path && (
            <p className="mt-1 text-sm text-muted-foreground">
              Platzierung: {firstItem.storage_location_path.replace(/\./g, " › ")}
            </p>
          )}
        </section>
      )}

      {/* Status */}
      {firstItem && (
        <section className="px-4">
          <h2 className="mb-3 text-lg font-bold">Status</h2>
          <StatusBadge status={firstItem.current_status} />
        </section>
      )}

      {/* ID & Infos */}
      {firstItem && (
        <section className="px-4">
          <h2 className="mb-3 text-lg font-bold">ID & Infos</h2>
          <div className="flex flex-col gap-2">
            <IdRow label="Barcode ID" value={firstItem.barcode_id} />
            {firstItem.rfid_id && (
              <IdRow label="RFID" value={firstItem.rfid_id} />
            )}
          </div>
        </section>
      )}

      {/* Kostümteile (Ensemble children) */}
      {children.length > 0 && (
        <section className="px-4">
          <h2 className="mb-3 text-lg font-bold">Kostümteile</h2>
          <div className="flex flex-col gap-2">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/kostuem/${child.id}`}
                className="rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <span className="text-sm font-medium">{child.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Similar Costumes */}
      {similarCostumes.length > 0 && (
        <SimilarCostumes costumes={similarCostumes} />
      )}

      {/* Historie */}
      {(costume.costume_provenance?.length ?? 0) > 0 && (
        <section className="px-4">
          <h2 className="mb-3 text-lg font-bold">Historie</h2>
          <div className="relative border-l-2 border-muted pl-4">
            {costume.costume_provenance!.map((prov) => (
              <div key={prov.id} className="relative mb-4 last:mb-0">
                <div className="absolute -left-[calc(1rem+5px)] top-1.5 h-2 w-2 rounded-full bg-gold" />
                <p className="text-sm font-medium">
                  {prov.production_title}
                  {prov.year ? ` (${prov.year})` : ""}
                </p>
                {prov.role_name && (
                  <p className="text-xs text-muted-foreground">
                    Rolle: {prov.role_name}
                  </p>
                )}
                {prov.actor_name && (
                  <p className="text-xs text-muted-foreground">
                    Darsteller: {prov.actor_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Helper components ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    available: "Verfügbar",
    rented: "Ausgeliehen",
    cleaning: "In Reinigung",
    repair: "In Reparatur",
    lost: "Verloren",
  };
  const colors: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    rented: "bg-yellow-100 text-yellow-800",
    cleaning: "bg-blue-100 text-blue-800",
    repair: "bg-orange-100 text-orange-800",
    lost: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function IdRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="font-mono text-sm">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="text-muted-foreground hover:text-foreground"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
