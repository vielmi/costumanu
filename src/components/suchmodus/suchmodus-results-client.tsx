"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SuchmodusFooter } from "@/components/suchmodus/suchmodus-footer";
import styles from "./suchmodus-results.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResultCostume = {
  id: string;
  name: string;
  clothingTypeLabel: string | null;
  imageUrl: string | null;
  provenance: string | null;
  theaterName: string | null;
  isAvailable: boolean;
};

// ─── Card ────────────────────────────────────────────────────────────────────

function CostumeCard({ costume }: { costume: ResultCostume }) {
  return (
    <Link href={`/suchmodus/costume/${costume.id}`} className={styles.card}>
      <div className={styles.cardImageWrap}>
        {costume.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={costume.imageUrl} alt={costume.name} className={styles.cardImage} />
        ) : (
          <div className={styles.cardImagePlaceholder} />
        )}
        <button
          type="button"
          className={styles.bookmarkBtn}
          aria-label="Merken"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <Image src="/icons/icon-heart.svg" alt="" width={18} height={18} />
        </button>
      </div>

      <div className={styles.cardInfo}>
        {costume.clothingTypeLabel && (
          <p className={styles.cardClothingType}>{costume.clothingTypeLabel}</p>
        )}
        <p className={styles.cardName}>{costume.name}</p>
        {costume.provenance && (
          <p className={styles.cardProvenance}>{costume.provenance}</p>
        )}
        <div className={styles.cardAvailability}>
          <span className={`${styles.availDot} ${costume.isAvailable ? styles.available : styles.onRequest}`}>
            {costume.isAvailable && <Image src="/icons/icon-check.svg" alt="" width={10} height={10} />}
          </span>
          {costume.theaterName && (
            <span className={styles.cardTheater}>{costume.theaterName}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SuchmodusResultsClient({
  title,
  count,
  costumes,
}: {
  title: string;
  count: number;
  costumes: ResultCostume[];
}) {
  const router = useRouter();

  return (
    <div className={styles.page}>
      {/* ═══ Header ═══ */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.back()}
            aria-label="Zurück"
          >
            <Image src="/icons/icon-arrow-left.svg" alt="" width={24} height={24} />
          </button>

          <div className={styles.titleGroup}>
            <p className={styles.titleText}>{title}</p>
            <p className={styles.countText}>{count.toLocaleString("de-CH")} Kostüme</p>
          </div>

          <div className={styles.headerControls}>
            <div className={styles.viewToggle}>
              <button type="button" className={`${styles.viewIconBtn} ${styles.active}`} aria-label="Fotoansicht">
                <Image src="/icons/icon-images.svg" alt="" width={20} height={20} />
              </button>
              <span className={styles.viewDivider} aria-hidden="true" />
              <button type="button" className={styles.viewIconBtn} aria-label="Listenansicht">
                <Image src="/icons/icon-list.svg" alt="" width={20} height={20} />
              </button>
              <span className={styles.viewDivider} aria-hidden="true" />
              <button type="button" className={styles.viewIconBtn} aria-label="Kategorieansicht">
                <Image src="/icons/icon-category.svg" alt="" width={20} height={20} />
              </button>
            </div>
            <span className={styles.viewDivider} aria-hidden="true" />
            <button type="button" className={styles.filterBtn} aria-label="Filter">
              <Image src="/icons/icon-filter.svg" alt="" width={16} height={16} />
              Filter
            </button>
          </div>
        </div>
      </header>

      {/* ═══ Grid ═══ */}
      {costumes.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>Keine Kostüme gefunden</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {costumes.map((c) => <CostumeCard key={c.id} costume={c} />)}
        </div>
      )}

      {/* ═══ Footer ═══ */}
      <SuchmodusFooter />
    </div>
  );
}
