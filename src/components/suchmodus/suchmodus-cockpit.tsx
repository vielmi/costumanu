import Link from "next/link";
import Image from "next/image";
import { SuchmodusHeader } from "@/components/suchmodus/suchmodus-header";
import { SuchmodusFooter } from "@/components/suchmodus/suchmodus-footer";
import { StandortSheet } from "@/components/suchmodus/standort-sheet";
import { getGenderIcon } from "@/lib/constants/icons";
import styles from "./suchmodus-cockpit.module.css";

export type NetworkTheater = {
  id: string;
  name: string;
  slug: string;
  settings: { brand_color?: string; show_in_network?: boolean } | null;
};

export type GenderTerm = {
  id: string;
  label_de: string;
};

// ─── Data ────────────────────────────────────────────────────────────────────

// Image hints for cockpit tiles — display label → image path
const CLOTHING_IMAGE: Record<string, string> = {
  "Kleider": "/images/suchmodus-20er.jpg",
  "Anzüge":  "/images/suchmodus-anzuege.jpg",
  "Hosen":   "/images/suchmodus-80er.jpg",
};

const EPOCH_IMAGE: Record<string, string> = {
  "Barock":      "/images/suchmodus-barock.jpg",
  "20-er Jahre": "/images/suchmodus-20er.jpg",
  "80-er Jahre": "/images/suchmodus-80er.jpg",
};

const SPARTE_IMAGE: Record<string, string> = {
  "Tanz":       "/images/suchmodus-tanz.jpg",
  "Schauspiel": "/images/suchmodus-schauspiel.jpg",
  "Oper":       "/images/suchmodus-oper.jpg",
};

// Display label → DB label_de (DB may use singular/short forms)
const CLOTHING_DB_LABEL: Record<string, string> = {
  "Kleider": "Kleid",
  "Anzüge":  "Anzug",
  "Hosen":   "Hose",
};

const FEATURED_CLOTHING = ["Kleider", "Anzüge", "Hosen"];
const FEATURED_EPOCHS   = ["Barock", "20-er Jahre", "80-er Jahre"];
const FEATURED_SPARTE   = ["Tanz", "Schauspiel", "Oper"];


// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryTile({ label, image, href }: { label: string; image?: string; href: string }) {
  return (
    <Link href={href} className={styles.categoryTile}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <div style={{ position: "absolute", inset: 0, background: "var(--overlay-medium)" }} />
      <div className={styles.tileLabelRow}>
        <span className="text-h2 text-h1--medium" style={{ color: "var(--neutral-white)" }}>
          {label}
        </span>
        <Image
          src="/icons/icon-arrow-right-2.svg"
          alt=""
          width={32}
          height={32}
          style={{ filter: "invert(1)", flexShrink: 0 }}
        />
      </div>
    </Link>
  );
}

function GenderCard({ label, icon, href }: { label: string; icon: string; href: string }) {
  return (
    <Link href={href} className={styles.genderCard}>
      <Image src={`/icons/${icon}.svg`} alt={label} width={44} height={44} className={styles.genderCardIcon} />
      <span className={styles.genderCardLabel}>{label}</span>
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.sectionTitleWrap}>
      <h2 className={styles.sectionTitle}>{children}</h2>
    </div>
  );
}

function TileRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.tileRow}>{children}</div>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SuchmodusCockpit({
  networkTheaters = [],
  theaters = [],
  genderTerms = [],
  clothingTypeTerms = [],
  epocheTerms = [],
  sparteTerms = [],
}: {
  networkTheaters?: NetworkTheater[];
  theaters?: NetworkTheater[];
  genderTerms?: GenderTerm[];
  clothingTypeTerms?: GenderTerm[];
  epocheTerms?: GenderTerm[];
  sparteTerms?: GenderTerm[];
}) {
  const clothingTiles = FEATURED_CLOTHING
    .map((label) => {
      const dbLabel = CLOTHING_DB_LABEL[label] ?? label;
      const term = clothingTypeTerms.find((t) => t.label_de === dbLabel);
      if (!term) return null;
      return { label, image: CLOTHING_IMAGE[label], href: `/suchmodus/results?clothing_type=${term.id}` };
    })
    .filter(Boolean) as { label: string; image: string; href: string }[];

  const epochTiles = FEATURED_EPOCHS
    .map((label) => {
      const term = epocheTerms.find((t) => t.label_de === label);
      if (!term) return null;
      return { label, image: EPOCH_IMAGE[label], href: `/suchmodus/results?epoche=${term.id}` };
    })
    .filter(Boolean) as { label: string; image: string; href: string }[];

  const sparteTiles = FEATURED_SPARTE
    .map((label) => {
      const term = sparteTerms.find((t) => t.label_de === label);
      if (!term) return null;
      return { label, image: SPARTE_IMAGE[label], href: `/suchmodus/results?sparte=${term.id}` };
    })
    .filter(Boolean) as { label: string; image: string; href: string }[];

  return (
    <div className={styles.page}>

      {/* ═══ Header ═══ */}
      <SuchmodusHeader genderTerms={genderTerms} />

      {/* ═══ Hero ═══ */}
      <div className={styles.hero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/suchmodus-oper-scene.jpg"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "var(--overlay-medium)" }} />

        {/* Filter bar */}
        <div className={styles.heroFilterBar}>
          <Link href="/suchmodus/filter" className={styles.heroFilterButton}>
            <Image src="/icons/icon-filter.svg" alt="" width={24} height={24} style={{ filter: "invert(1)" }} />
            <span className="text-subtitle-1" style={{ color: "var(--neutral-white)", fontWeight: "var(--font-weight-500)", whiteSpace: "nowrap" }}>
              Kostüm finden
            </span>
          </Link>
          <StandortSheet theaters={theaters} />
          <Link href="/suchmodus/search" className={styles.heroFilterCircle}>
            <Image src="/icons/icon-search.svg" alt="Suche" width={24} height={24} className={styles.heroCircleIcon} />
          </Link>
        </div>

        {/* Hero text */}
        <div className={styles.heroText}>
          <h1 className="text-h1--medium" style={{
            fontSize: "clamp(28px, 5.3vw, 60px)",
            color: "var(--neutral-white)",
            lineHeight: "var(--line-height-120)",
            margin: 0,
          }}>
            Der Kostüm-Finder für die Film- & Theaterbranche
          </h1>
        </div>
      </div>

      {/* ═══ Gender Cards ═══ */}
      <div className={styles.sectionPadded}>
        <div className={styles.genderGrid}>
          {genderTerms.map((term) => (
            <GenderCard
              key={term.id}
              label={term.label_de}
              icon={`icon-${getGenderIcon(term.label_de)}`}
              href={`/suchmodus/results?gender=${term.id}`}
            />
          ))}
        </div>
      </div>

      {/* ═══ Bekleidungsart ═══ */}
      {clothingTiles.length > 0 && (
        <div className={styles.sectionPadded} style={{ background: "var(--accent-01)" }}>
          <SectionTitle>Bekleidungsart</SectionTitle>
          <TileRow>
            {clothingTiles.map((t) => <CategoryTile key={t.label} {...t} />)}
          </TileRow>
        </div>
      )}

      {/* ═══ CTA Event Card ═══ */}
      <div className={styles.sectionPadded}>
        <div className={styles.ctaCard}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/suchmodus-barock-scene.jpg"
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "var(--overlay-heavy)" }} />
          <div style={{ position: "relative", zIndex: 1, padding: "40px clamp(20px, 5vw, 60px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 80 }}>
              <span className="text-body-1" style={{ color: "var(--neutral-white)", fontWeight: "var(--font-weight-500)" }}>
                Save the date
              </span>
              {[0, 1, 2, 3].map((i) => (
                <Image key={i} src="/icons/icon-arrow-right-2.svg" alt="" width={42} height={42} style={{ filter: "invert(1)" }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <p className="text-h1 text-h1--regular" style={{ color: "var(--neutral-white)", marginBottom: 8 }}>
                  Rampenverkauf Fundus<br />Südpol Luzern
                </p>
                <p className="text-h1 text-h1--regular" style={{ color: "var(--primary-900)" }}>
                  05.05.2024
                </p>
              </div>
              <Image
                src="/icons/icon-arrow-right-2.svg"
                alt=""
                width={60}
                height={60}
                style={{ filter: "invert(62%) sepia(40%) saturate(500%) hue-rotate(5deg)", flexShrink: 0 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Epoche ═══ */}
      {epochTiles.length > 0 && (
        <div className={styles.sectionPaddedBottom}>
          <SectionTitle>Epoche</SectionTitle>
          <TileRow>
            {epochTiles.map((t) => <CategoryTile key={t.label} {...t} />)}
          </TileRow>
        </div>
      )}

      {/* ═══ Sparte ═══ */}
      {sparteTiles.length > 0 && (
        <div className={styles.sectionPaddedBottom}>
          <SectionTitle>Sparte</SectionTitle>
          <TileRow>
            {sparteTiles.map((t) => <CategoryTile key={t.label} {...t} />)}
          </TileRow>
        </div>
      )}

      {/* ═══ Kostüm Netzwerk ═══ */}
      <div className={styles.sectionPadded}>
        <h2 className="text-h1 text-h1--medium" style={{ color: "var(--neutral-grey-600)", textAlign: "center", marginBottom: 48 }}>
          Kostüm Netzwerk
        </h2>
        <div className={styles.networkGrid}>
          {networkTheaters.map(({ name, slug, settings }) => (
            <Link
              key={slug}
              href={`/netzwerk/${slug}`}
              className={styles.networkOval}
              style={{ background: settings?.brand_color ?? "var(--secondary-900)" }}
            >
              <div style={{ position: "absolute", inset: 0, background: "var(--overlay-light)" }} />
              <span style={{
                position: "relative",
                zIndex: 1,
                fontFamily: "var(--font-family-base)",
                fontWeight: "var(--font-weight-700)",
                fontSize: "var(--font-size-300)",
                color: "var(--neutral-white)",
                textAlign: "center",
                padding: "0 20px",
              }}>
                {name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══ Footer ═══ */}
      <SuchmodusFooter />

    </div>
  );
}
