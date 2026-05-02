"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Heart, ShoppingBag, MapPin, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageCarousel } from "@/components/costume/image-carousel";
import { CostumeSpecs } from "@/components/costume/costume-specs";
import { SimilarCostumes } from "@/components/costume/similar-costumes";
import { ContextMenu } from "@/components/ui/context-menu";
import { DeleteConfirmationSheet } from "@/components/ui/delete-confirmation-sheet";
import { createClient } from "@/lib/supabase/client";
import { deleteCostume } from "@/lib/services/costume-service";
import { t } from "@/lib/i18n";
import type { Costume, TaxonomyTerm } from "@/lib/types/costume";

type CostumeDetailClientProps = {
  costume: Costume;
  taxonomyByVocabulary: Record<string, TaxonomyTerm[]>;
  ensembleChildren: Costume[];
  similarCostumes: Costume[];
};

export function CostumeDetailClient({
  costume,
  taxonomyByVocabulary,
  ensembleChildren,
  similarCostumes,
}: CostumeDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const firstItem = costume.costume_items?.[0];
  const firstProvenance = costume.costume_provenance?.[0];

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    try {
      const mediaPaths = (costume.costume_media ?? []).map((m) => m.storage_path);
      await deleteCostume(supabase, costume.id, mediaPaths);
      router.push("/fundus");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
      setDeleting(false);
      setShowDeleteSheet(false);
    }
  }

  const menuItems = [
    { label: "Bearbeiten", action: () => { setMenuOpen(false); router.push(`/kostueme/neu?edit=${costume.id}`); } },
    { label: "Löschen",    action: () => { setMenuOpen(false); setShowDeleteSheet(true); }, danger: true },
  ];

  return (
    <>
    <div className="flex flex-col gap-6 pb-8">
      {/* Header row: Breadcrumbs + 3-dot menu */}
      <div className="flex items-start justify-between px-4 pt-4">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("costume.back")}
          </button>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {costume.gender_term && (
              <>
                <Link href={`/fundus?gender=${encodeURIComponent(costume.gender_term.label_de)}`} className="hover:underline">
                  {costume.gender_term.label_de}
                </Link>
                <span>&rsaquo;</span>
              </>
            )}
            {costume.clothing_type && (
              <>
                <Link href={`/fundus?clothingType=${encodeURIComponent(costume.clothing_type.label_de)}`} className="hover:underline">
                  {costume.clothing_type.label_de}
                </Link>
                <span>&rsaquo;</span>
              </>
            )}
            <span className="text-foreground">{costume.name}</span>
          </div>
        </div>

        <ContextMenu
          items={menuItems}
          isOpen={menuOpen}
          onToggle={() => setMenuOpen((o) => !o)}
          onClose={() => setMenuOpen(false)}
        />
      </div>

      {/* Inline error banner */}
      {actionError && (
        <div
          style={{
            margin: "0 16px",
            padding: "8px 12px",
            background: "var(--color-error-light)",
            borderRadius: "var(--radius-xs)",
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-200)",
            color: "var(--color-error)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {actionError}
          <button
            type="button"
            onClick={() => setActionError(null)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", color: "var(--color-error)" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Two-column: Image left | Info right */}
      <div className="flex flex-col gap-6 px-4" style={{ alignItems: "flex-start" }}
        data-layout="costume-hero"
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start", width: "100%" }}
          className="max-[743px]:block max-[743px]:space-y-6"
        >
          {/* Left: Image */}
          <ImageCarousel
            media={costume.costume_media ?? []}
            name={costume.name}
            height="480px"
            objectFit="contain"
            className=""
          />

          {/* Right: Info panel */}
          <div className="flex flex-col gap-4">
            {/* Title Block */}
            <div>
              {costume.clothing_type && (
                <Badge variant="secondary" className="mb-2">
                  {costume.clothing_type.label_de}
                </Badge>
              )}
              <h1 className="text-2xl font-bold">{costume.name}</h1>
              {firstItem?.size_label && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("costume.size", { size: firstItem.size_label })}
                </p>
              )}
            </div>

            {/* Description */}
            {costume.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {costume.description}
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {costume.gender_term && (
                <Badge variant="outline">{costume.gender_term.label_de}</Badge>
              )}
              {costume.is_ensemble && <Badge variant="outline">{t("costume.multiPart")}</Badge>}
              {costume.is_ensemble && <Badge variant="outline">{t("costume.series")}</Badge>}
              {(taxonomyByVocabulary["epoche"] ?? []).map((t) => (
                <Badge key={t.id} variant="outline">
                  {t.label_de}
                </Badge>
              ))}
            </div>

            {/* Theater Badge */}
            {costume.theater && (
              <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 self-start">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{costume.theater.name}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button className="flex-1" style={{ background: "var(--primary-900)", color: "var(--neutral-white)" }}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                {t("costume.rent")}
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">{t("costume.share")}</span>
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
                <span className="sr-only">{t("costume.bookmark")}</span>
              </Button>
            </div>
          </div>
        </div>
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
          <h2 className="mb-3 text-lg font-bold">{t("costume.location")}</h2>
          {costume.theater && (
            <p className="text-sm font-medium">{costume.theater.name}</p>
          )}
          {firstItem?.storage_location_path && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("costume.placement")}: {firstItem.storage_location_path.replace(/\./g, " › ")}
            </p>
          )}
        </section>
      )}

      {/* Status */}
      {firstItem && (
        <section className="px-4">
          <h2 className="mb-3 text-lg font-bold">{t("costume.status")}</h2>
          <StatusBadge status={firstItem.current_status} />
        </section>
      )}

      {/* ID & Infos */}
      {firstItem && (
        <section className="px-4">
          <h2 className="mb-3 text-lg font-bold">{t("costume.idAndInfo")}</h2>
          <div className="flex flex-col gap-2">
            <IdRow label="Barcode ID" value={firstItem.barcode_id} />
            {firstItem.rfid_id && (
              <IdRow label="RFID" value={firstItem.rfid_id} />
            )}
          </div>
        </section>
      )}

      {/* Kostümteile (Ensemble children) */}
      {ensembleChildren.length > 0 && (
        <section className="px-4">
          <h2 className="mb-3 text-lg font-bold">{t("costume.costumeParts")}</h2>
          <div className="flex flex-col gap-2">
            {ensembleChildren.map((child) => (
              <Link
                key={child.id}
                href={`/costume/${child.id}`}
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
          <h2 className="mb-3 text-lg font-bold">{t("costume.history")}</h2>
          <div className="relative border-l-2 border-muted pl-4">
            {costume.costume_provenance!.map((prov) => (
              <div key={prov.id} className="relative mb-4 last:mb-0">
                <div className="absolute -left-[calc(1rem+5px)] top-1.5 h-2 w-2 rounded-full" style={{ background: "var(--primary-900)" }} />
                <p className="text-sm font-medium">
                  {prov.production_title}
                  {prov.year ? ` (${prov.year})` : ""}
                </p>
                {prov.role_name && (
                  <p className="text-xs text-muted-foreground">
                    {t("costume.role")}: {prov.role_name}
                  </p>
                )}
                {prov.actor_name && (
                  <p className="text-xs text-muted-foreground">
                    {t("costume.actor")}: {prov.actor_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>

    {showDeleteSheet && (
      <DeleteConfirmationSheet
        itemName={costume.name}
        isDeleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteSheet(false)}
      />
    )}
    </>
  );
}

// ─── Helper components ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    available: t("costume.statusAvailable"),
    rented: t("costume.statusRented"),
    cleaning: t("costume.statusCleaning"),
    repair: t("costume.statusRepair"),
    lost: t("costume.statusLost"),
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
