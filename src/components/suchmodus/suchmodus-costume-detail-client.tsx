"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SuchmodusFooter } from "@/components/suchmodus/suchmodus-footer";
import styles from "./suchmodus-costume-detail.module.css";
import type { TaxonomyTerm } from "@/lib/types/costume";

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaItem    = { id: string; url: string };
type TheaterInfo  = { id: string; name: string; slug: string; address_info?: Record<string, unknown> | null };
type ItemInfo     = { barcode_id: string; rfid_id?: string | null; size_label?: string | null; current_status: string; storage_location_path?: string | null };
type ProvenanceInfo = { id: string; production_title: string; year?: number | null; actor_name?: string | null; role_name?: string | null; director_name?: string | null; costume_designer?: string | null; costume_assistant?: string | null };
type SimilarCostume = { id: string; name: string; imageUrl: string | null; clothingTypeLabel: string | null; provenance: string | null };

export type SuchmodusCostumeDetailProps = {
  id: string;
  name: string;
  description: string | null;
  isEnsemble: boolean;
  mediaWithUrls: MediaItem[];
  genderTerm: TaxonomyTerm | null;
  clothingType: TaxonomyTerm | null;
  theater: TheaterInfo | null;
  firstItem: ItemInfo | null;
  firstProvenance: ProvenanceInfo | null;
  allProvenance: ProvenanceInfo[];
  taxonomyByVocabulary: Record<string, TaxonomyTerm[]>;
  ensembleChildren: { id: string; name: string }[];
  similarCostumes: SimilarCostume[];
};

// ─── Accordion ────────────────────────────────────────────────────────────────

function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.accordion}>
      <button type="button" className={styles.accordionHeader} onClick={() => setOpen((v) => !v)}>
        <span className={styles.accordionTitle}>{title}</span>
        <span className={`${styles.accordionChevron} ${open ? styles.open : ""}`}>
          <Image src="/icons/icon-arrow-dropdown-down.svg" alt="" width={16} height={16} />
        </span>
      </button>
      <div className={styles.accordionLine} />
      {open && <div className={styles.accordionBody}>{children}</div>}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className={styles.specRow}>
      <p className={styles.specLabel}>{label}</p>
      <p className={styles.specValue}>{value}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SuchmodusCostumeDetailClient({
  id: _id,
  name,
  description,
  isEnsemble,
  mediaWithUrls,
  genderTerm,
  clothingType,
  theater,
  firstItem,
  firstProvenance,
  allProvenance,
  taxonomyByVocabulary,
  ensembleChildren,
  similarCostumes,
}: SuchmodusCostumeDetailProps) {
  const router = useRouter();
  const [imgIndex, setImgIndex] = useState(0);

  const isAvailable = firstItem?.current_status === "available";
  const address = theater?.address_info;
  const addressStr = address
    ? [address.street, address.postal_code, address.city].filter(Boolean).join(" ")
    : null;

  const epochTerms  = (taxonomyByVocabulary["epoche"]   ?? []).map((t) => t.label_de).join(", ");
  const segmentTerms = (taxonomyByVocabulary["segment"] ?? []).map((t) => t.label_de).join(", ");
  const materialTerms = (taxonomyByVocabulary["material"] ?? []).map((t) => t.label_de).join(", ");
  const colorTerms  = (taxonomyByVocabulary["farbe"]    ?? []).map((t) => t.label_de).join(", ");

  return (
    <div className={styles.page}>

      {/* ═══ Breadcrumb ═══ */}
      <nav className={styles.breadcrumbBar}>
        <button type="button" className={styles.backBtn} onClick={() => router.back()} aria-label="Zurück">
          <Image src="/icons/icon-arrow-left.svg" alt="" width={15} height={15} />
        </button>
        <div className={styles.breadcrumbs}>
          <Link href="/suchmodus" className={styles.breadcrumbItem}>Home</Link>
          {genderTerm && (
            <>
              <span className={styles.breadcrumbSep}>|</span>
              <Link href={`/suchmodus/results?gender=${genderTerm.id}`} className={styles.breadcrumbItem}>
                {genderTerm.label_de}
              </Link>
            </>
          )}
          {clothingType && (
            <>
              <span className={styles.breadcrumbSep}>|</span>
              <Link
                href={`/suchmodus/results?gender=${genderTerm?.id ?? ""}&clothing_type=${clothingType.id}`}
                className={styles.breadcrumbItem}
              >
                {clothingType.label_de}
              </Link>
            </>
          )}
          <span className={styles.breadcrumbSep}>|</span>
          <span className={styles.breadcrumbCurrent}>{name}</span>
        </div>
      </nav>

      {/* ═══ Image carousel ═══ */}
      <div
        className={styles.imageWrap}
        onClick={() => setImgIndex((i) => (i === mediaWithUrls.length - 1 ? 0 : i + 1))}
        style={{ cursor: mediaWithUrls.length > 1 ? "pointer" : "default" }}
      >
        {mediaWithUrls.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaWithUrls[imgIndex]?.url} alt={name} className={styles.mainImage} />
        ) : (
          <div className={styles.noImageBox}>Kein Foto</div>
        )}
        <button
          type="button"
          className={styles.heartBtn}
          aria-label="Merken"
          onClick={(e) => e.stopPropagation()}
        >
          <Image src="/icons/icon-heart.svg" alt="" width={18} height={18} />
        </button>
      </div>

      {/* Dots */}
      {mediaWithUrls.length > 1 && (
        <div className={styles.imageDots}>
          {mediaWithUrls.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className={`${styles.dot} ${i === imgIndex ? styles.activeDot : ""}`}
              onClick={() => setImgIndex(i)}
              aria-label={`Bild ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ═══ Info block ═══ */}
      <div className={styles.info}>
        {clothingType && <p className={styles.clothingTypeLabel}>{clothingType.label_de}</p>}
        <h1 className={styles.title}>{name}</h1>

        {/* Gender + Ensemble meta */}
        <div className={styles.metaRow}>
          {genderTerm && (
            <div className={styles.metaItem}>
              <Image src="/icons/icon-user.svg" alt="" width={20} height={20} style={{ opacity: 0.7 }} />
              <p className={styles.metaLabel}>{genderTerm.label_de}</p>
            </div>
          )}
          {isEnsemble && (
            <div className={styles.metaItem}>
              <Image src="/icons/icon-family.svg" alt="" width={20} height={20} style={{ opacity: 0.7 }} />
              <p className={styles.metaLabel}>Mehrteilig</p>
            </div>
          )}
        </div>

        {firstItem?.size_label && (
          <p className={styles.sizeLabel}>Konfektionsgrösse {firstItem.size_label}</p>
        )}

        {description && <p className={styles.description}>{description}</p>}

        {/* Availability */}
        <div className={styles.availRow}>
          <span className={`${styles.availDot} ${isAvailable ? styles.available : styles.onRequest}`}>
            {isAvailable && <Image src="/icons/icon-check.svg" alt="" width={10} height={10} />}
          </span>
          {theater && <p className={styles.theaterName}>{theater.name}</p>}
        </div>
      </div>

      {/* ═══ CTA buttons ═══ */}
      <div className={styles.ctaGroup}>
        <div className={styles.btnRow}>
          <button type="button" className={`btn-secondary ${styles.btnSecondary}`}>
            <Image src="/icons/icon-share.svg" alt="" width={22} height={22} style={{ filter: "invert(30%) sepia(80%) saturate(400%) hue-rotate(5deg)" }} />
            Teilen
          </button>
          <button type="button" className={`btn-secondary ${styles.btnSecondary}`}>
            <Image src="/icons/icon-heart.svg" alt="" width={18} height={18} />
            Merken
          </button>
        </div>
      </div>

      {/* ═══ Kostümspezifikationen ═══ */}
      <div className={styles.specsSection}>
        <h2 className={styles.specsTitle}>Kostümspezifikationen</h2>

        <Accordion title="Kategorie" defaultOpen>
          <SpecRow label="Gender / Typ"    value={genderTerm?.label_de} />
          <SpecRow label="Epoche"          value={epochTerms || null} />
          <SpecRow label="Segment"         value={segmentTerms || null} />
          <SpecRow label="Bekleidungsart"  value={clothingType?.label_de} />
        </Accordion>

        {firstProvenance && (
          <Accordion title="Aufführung">
            <SpecRow label="Stücktitel"       value={firstProvenance.production_title} />
            <SpecRow label="Darsteller"       value={firstProvenance.actor_name} />
            <SpecRow label="Rolle"            value={firstProvenance.role_name} />
            <SpecRow label="Regie"            value={firstProvenance.director_name} />
            <SpecRow label="Kostümbildner"    value={firstProvenance.costume_designer} />
            <SpecRow label="Kostümassistenz"  value={firstProvenance.costume_assistant} />
          </Accordion>
        )}

        {firstItem && (
          <Accordion title="Masse">
            <SpecRow label="Konfektionsgrösse" value={firstItem.size_label} />
            {/* size_data fields if available */}
          </Accordion>
        )}

        {(theater || firstItem?.storage_location_path) && (
          <Accordion title="Standort">
            {theater && (
              <div className={styles.specRow}>
                <p className={styles.specLabel}>{theater.name}</p>
                {addressStr && <p className={styles.specValue}>{addressStr}</p>}
              </div>
            )}
            {firstItem?.storage_location_path && (
              <SpecRow
                label="Platzierung"
                value={firstItem.storage_location_path.replace(/\./g, " › ")}
              />
            )}
            {firstItem && (
              <SpecRow label="Status" value={STATUS_LABELS[firstItem.current_status] ?? firstItem.current_status} />
            )}
          </Accordion>
        )}

        {firstItem && (
          <Accordion title="ID & Infos">
            <SpecRow label="Barcode ID" value={firstItem.barcode_id} />
            {firstItem.rfid_id && <SpecRow label="RFID" value={firstItem.rfid_id} />}
          </Accordion>
        )}

        {(materialTerms || colorTerms) && (
          <Accordion title="Material & Farbe">
            <SpecRow label="Material"  value={materialTerms || null} />
            <SpecRow label="Farbe"     value={colorTerms || null} />
          </Accordion>
        )}

        {ensembleChildren.length > 0 && (
          <Accordion title="Kostümteile">
            {ensembleChildren.map((child) => (
              <div key={child.id} className={styles.specRow}>
                <Link
                  href={`/suchmodus/costume/${child.id}`}
                  className={styles.specValue}
                  style={{ textDecorationLine: "underline" }}
                >
                  {child.name}
                </Link>
              </div>
            ))}
          </Accordion>
        )}

        {allProvenance.length > 0 && (
          <Accordion title="Historie">
            {allProvenance.map((prov) => (
              <div key={prov.id} className={styles.specRow}>
                <p className={styles.specLabel}>{prov.production_title}{prov.year ? ` (${prov.year})` : ""}</p>
                {prov.role_name && <p className={styles.specValue}>Rolle: {prov.role_name}</p>}
              </div>
            ))}
          </Accordion>
        )}
      </div>

      {/* ═══ Ähnliche Kostüme ═══ */}
      {similarCostumes.length > 0 && (
        <div className={styles.similarSection}>
          <p className={styles.similarTitle}>Ähnliche Kostüme</p>
          <div className={styles.similarScroll}>
            {similarCostumes.map((c) => (
              <Link key={c.id} href={`/suchmodus/costume/${c.id}`} className={styles.similarCard}>
                <div className={styles.similarImageWrap}>
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt={c.name} className={styles.similarImage} />
                  ) : (
                    <div className={styles.noImageBox} style={{ borderRadius: "inherit" }} />
                  )}
                  <button
                    type="button"
                    className={styles.similarHeartBtn}
                    aria-label="Merken"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    <Image src="/icons/icon-heart.svg" alt="" width={18} height={18} />
                  </button>
                </div>
                <div className={styles.similarCardInfo}>
                  {c.clothingTypeLabel && <p className={styles.similarCardType}>{c.clothingTypeLabel}</p>}
                  <p className={styles.similarCardName}>{c.name}</p>
                  {c.provenance && <p className={styles.similarCardProv}>{c.provenance}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Footer ═══ */}
      <SuchmodusFooter />

    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  available: "Verfügbar",
  rented:    "Ausgeliehen",
  cleaning:  "Reinigung",
  repair:    "Reparatur",
  lost:      "Verloren",
};
