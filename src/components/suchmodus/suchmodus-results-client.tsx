"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5L9 12L15 19" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 15.5S2 11 2 6.5C2 4.5 3.5 3 5.5 3C7 3 8.5 3.8 9 5C9.5 3.8 11 3 12.5 3C14.5 3 16 4.5 16 6.5C16 11 9 15.5 9 15.5Z" stroke="#000000" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
      <path d="M1 4L3.5 6.5L9 1" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4L10 8L6 12" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
          <HeartIcon />
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
            {costume.isAvailable && <CheckIcon />}
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

const FOOTER_LINKS = [
  { label: "Häufige Fragen",     href: "/support"  },
  { label: "Ausleihe & Abholung", href: "/rental"  },
  { label: "Support & Kontakt",   href: "/support"  },
] as const;

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
            <ArrowLeft />
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
      <footer className={styles.footer}>
        <span className={styles.footerLogo}>kostüm+</span>
        <nav className={styles.footerLinks}>
          {FOOTER_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className={styles.footerLink}>
              <span>{link.label}</span>
              <ArrowRightSmall />
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
