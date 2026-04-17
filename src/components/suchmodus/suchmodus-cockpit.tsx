import Link from "next/link";
import Image from "next/image";
import { AppLogo } from "@/components/layout/app-logo";
import { SiteFooter } from "@/components/layout/site-footer";
import styles from "./suchmodus-cockpit.module.css";

export type NetworkTheater = {
  id: string;
  name: string;
  slug: string;
  settings: { brand_color?: string; show_in_network?: boolean } | null;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const GENDER_CARDS = [
  { label: "Damen",   icon: "icon-female",   href: "/results?gender=damen"   },
  { label: "Herren",  icon: "icon-male",     href: "/results?gender=herren"  },
  { label: "Unisex",  icon: "icon-unisex",   href: "/results?gender=unisex"  },
  { label: "Kinder",  icon: "icon-children", href: "/results?gender=kinder"  },
  { label: "Tier",    icon: "icon-animal",   href: "/results?gender=tier"    },
  { label: "Fantasy", icon: "icon-fantasy",  href: "/results?gender=fantasy" },
];

const BEKLEIDUNGSART_TILES = [
  { label: "Kleider",            image: "/images/suchmodus-20er.jpg",      href: "/results?type=kleider"  },
  { label: "Anzüge",             image: "/images/suchmodus-anzuege.jpg",   href: "/results?type=anzuege"  },
  { label: "Jumpsuit / Overall", image: "/images/suchmodus-jumpsuit.jpg",  href: "/results?type=jumpsuit" },
];

const EPOCHE_TILES = [
  { label: "Barock",      image: "/images/suchmodus-barock.jpg",   href: "/results?epoch=barock" },
  { label: "20-er Jahre", image: "/images/suchmodus-20er.jpg",     href: "/results?epoch=1920"   },
  { label: "80-er Jahre", image: "/images/suchmodus-80er.jpg",     href: "/results?epoch=1980"   },
];

const SPARTE_TILES = [
  { label: "Tanz",       image: "/images/suchmodus-tanz.jpg",       href: "/results?sparte=tanz"       },
  { label: "Schauspiel", image: "/images/suchmodus-feuerwehr.jpg",  href: "/results?sparte=schauspiel" },
  { label: "Oper",       image: "/images/suchmodus-oper.jpg",       href: "/results?sparte=oper"       },
];

const BEKLEIDUNGSART2_TILES = [
  { label: "Polizei",   image: "/images/suchmodus-polizei.jpg",    href: "/results?type=polizei"   },
  { label: "Reinigung", image: "/images/suchmodus-reinigung.jpg",  href: "/results?type=reinigung" },
  { label: "Feuerwehr", image: "/images/suchmodus-schauspiel.jpg", href: "/results?type=feuerwehr" },
];

const HEADER_ICONS = [
  { icon: "icon-user",         href: "/profile",  label: "Profil"      },
  { icon: "icon-chat",         href: "/messages", label: "Nachrichten" },
  { icon: "icon-heart",        href: "/wishlist", label: "Merkliste"   },
  { icon: "icon-shopping-bag", href: "/rental",   label: "Ausleihe"    },
] as const;

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
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div className={styles.tileLabelRow}>
        <span className="text-h2 text-h1--medium" style={{ color: "#FFFFFF" }}>
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
      <Image src={`/icons/${icon}.svg`} alt={label} width={44} height={44} />
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

export function SuchmodusCockpit({ networkTheaters = [] }: { networkTheaters?: NetworkTheater[] }) {
  return (
    <div className={styles.page}>

      {/* ═══ Header ═══ */}
      <header className={styles.header}>
        <AppLogo />
        <div className={styles.headerIcons}>
          {HEADER_ICONS.map(({ icon, href, label }) => (
            <Link key={href} href={href} className={styles.headerIcon}>
              <Image src={`/icons/${icon}.svg`} alt={label} width={24} height={24} />
            </Link>
          ))}
        </div>
      </header>

      {/* ═══ Hero ═══ */}
      <div className={styles.hero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/suchmodus-oper-scene.jpg"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />

        {/* Filter bar */}
        <div className={styles.heroFilterBar}>
          <Link href="/results" className={styles.heroFilterButton}>
            <Image src="/icons/icon-filter.svg" alt="" width={24} height={24} style={{ filter: "invert(1)" }} />
            <span className="text-subtitle-1" style={{ color: "#FFFFFF", fontWeight: "var(--font-weight-500)", whiteSpace: "nowrap" }}>
              Kostüm finden
            </span>
          </Link>
          <Link href="/results" className={styles.heroFilterCircle}>
            <Image src="/icons/icon-location.svg" alt="Standort" width={24} height={24} />
          </Link>
          <Link href="/search" className={styles.heroFilterCircle}>
            <Image src="/icons/icon-search.svg" alt="Suche" width={24} height={24} />
          </Link>
        </div>

        {/* Hero text */}
        <div className={styles.heroText}>
          <h1 className="text-h1--medium" style={{
            fontSize: "clamp(28px, 5.3vw, 60px)",
            color: "#FFFFFF",
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
          {GENDER_CARDS.map((c) => <GenderCard key={c.label} {...c} />)}
        </div>
      </div>

      {/* ═══ Bekleidungsart ═══ */}
      <div className={styles.sectionPadded} style={{ background: "var(--accent-01)" }}>
        <SectionTitle>Bekleidungsart</SectionTitle>
        <TileRow>
          {BEKLEIDUNGSART_TILES.map((t) => <CategoryTile key={t.label} {...t} />)}
        </TileRow>
      </div>

      {/* ═══ CTA Event Card ═══ */}
      <div className={styles.sectionPadded}>
        <div className={styles.ctaCard}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/suchmodus-barock-scene.jpg"
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
          <div style={{ position: "relative", zIndex: 1, padding: "40px clamp(20px, 5vw, 60px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 80 }}>
              <span className="text-body-1" style={{ color: "#FFFFFF", fontWeight: "var(--font-weight-500)" }}>
                Save the date
              </span>
              {[0, 1, 2, 3].map((i) => (
                <Image key={i} src="/icons/icon-arrow-right-2.svg" alt="" width={42} height={42} style={{ filter: "invert(1)" }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <p className="text-h1 text-h1--regular" style={{ color: "#FFFFFF", marginBottom: 8 }}>
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
      <div className={styles.sectionPaddedBottom}>
        <SectionTitle>Epoche</SectionTitle>
        <TileRow>
          {EPOCHE_TILES.map((t) => <CategoryTile key={t.label} {...t} />)}
        </TileRow>
      </div>

      {/* ═══ Sparte ═══ */}
      <div className={styles.sectionPaddedBottom}>
        <SectionTitle>Sparte</SectionTitle>
        <TileRow>
          {SPARTE_TILES.map((t) => <CategoryTile key={t.label} {...t} />)}
        </TileRow>
      </div>

      {/* ═══ Arbeitsuniformen ═══ */}
      <div className={styles.sectionPaddedBottom}>
        <SectionTitle>Arbeitsuniformen</SectionTitle>
        <TileRow>
          {BEKLEIDUNGSART2_TILES.map((t) => <CategoryTile key={t.label} {...t} />)}
        </TileRow>
      </div>

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
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
              <span style={{
                position: "relative",
                zIndex: 1,
                fontFamily: "var(--font-family-base)",
                fontWeight: "var(--font-weight-700)",
                fontSize: "var(--font-size-300)",
                color: "#FFFFFF",
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
      <SiteFooter />

    </div>
  );
}
