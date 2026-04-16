import Link from "next/link";
import Image from "next/image";
import { AppLogo } from "@/components/layout/app-logo";
import { SiteFooter } from "@/components/layout/site-footer";

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryTile({ label, image, href }: { label: string; image?: string; href: string }) {
  return (
    <Link
      href={href}
      style={{
        flexShrink: 0,
        borderRadius: 20,
        position: "relative",
        overflow: "hidden",
        background: "var(--secondary-900)",
        display: "block",
        textDecoration: "none",
        // Desktop: flex:1, Mobile: 75vw — via CSS class below
      }}
      className="category-tile"
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div style={{ position: "absolute", bottom: 24, left: 24, display: "flex", alignItems: "center", gap: 12 }}>
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
    <Link
      href={href}
      style={{
        flex: 1,
        minWidth: 0,
        height: 140,
        background: "#FFFFFF",
        border: "1px solid var(--secondary-900)",
        borderRadius: "var(--radius-md)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 14,
        gap: 8,
        textDecoration: "none",
        cursor: "pointer",
      }}
    >
      <Image src={`/icons/${icon}.svg`} alt={label} width={44} height={44} />
      <span className="text-h6" style={{ color: "var(--secondary-900)", fontWeight: "var(--font-weight-500)" }}>
        {label}
      </span>
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-h1 text-h1--medium" style={{ color: "var(--neutral-grey-600)", marginBottom: 32 }}>
      {children}
    </h2>
  );
}

// Horizontal scroll row for tiles on mobile, flex row on desktop
function TileRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="tile-row">
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SuchmodusCockpit({ networkTheaters = [] }: { networkTheaters?: NetworkTheater[] }) {
  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh" }}>

      {/* Responsive styles */}
      <style>{`
        .suchmodus-padding {
          padding: 60px 67px;
        }
        .suchmodus-padding-bottom {
          padding: 0 67px 60px;
        }
        .tile-row {
          display: flex;
          gap: 30px;
        }
        .category-tile {
          flex: 1;
          min-height: 430px;
        }
        .gender-row {
          display: flex;
          gap: 30px;
          width: 100%;
        }
        .hero-height {
          height: 668px;
        }
        .hero-text {
          position: absolute;
          bottom: 80px;
          left: 74px;
          max-width: 573px;
        }
        .hero-filterbar {
          position: absolute;
          top: 42px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .network-oval {
          width: 255px;
          height: 381px;
          border-radius: 166px;
        }
        @media (max-width: 743px) {
          .suchmodus-padding {
            padding: 40px 16px;
          }
          .suchmodus-padding-bottom {
            padding: 0 0 40px;
          }
          .suchmodus-section-title {
            padding: 0 16px;
          }
          .tile-row {
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            padding: 0 16px;
            gap: 12px;
            /* Hide scrollbar */
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .tile-row::-webkit-scrollbar {
            display: none;
          }
          .category-tile {
            flex: none;
            width: 75vw;
            min-height: 220px;
            scroll-snap-align: start;
          }
          .gender-row {
            gap: 12px;
          }
          .hero-height {
            height: 420px;
          }
          .hero-text {
            bottom: 32px;
            left: 20px;
            right: 20px;
            max-width: none;
          }
          .hero-filterbar {
            top: 20px;
            left: 16px;
            right: 16px;
            transform: none;
            width: calc(100% - 32px);
          }
          .network-oval {
            width: 160px;
            height: 240px;
            border-radius: 100px;
          }
        }
      `}</style>

      {/* ═══ Header ═══ */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 80,
        background: "#FFFFFF",
        boxShadow: "0px 1px 10px rgba(0,0,0,0.20)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
      }}>
        <AppLogo />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[
            { icon: "icon-user",         href: "/profile",  label: "Profil"      },
            { icon: "icon-chat",         href: "/messages", label: "Nachrichten" },
            { icon: "icon-heart",        href: "/wishlist", label: "Merkliste"   },
            { icon: "icon-shopping-bag", href: "/rental",   label: "Ausleihe"    },
          ].map(({ icon, href, label }) => (
            <Link key={href} href={href} style={{
              width: 45, height: 45,
              display: "flex", alignItems: "center", justifyContent: "center",
              textDecoration: "none",
            }}>
              <Image src={`/icons/${icon}.svg`} alt={label} width={24} height={24} />
            </Link>
          ))}
        </div>
      </header>

      {/* ═══ Hero ═══ */}
      <div className="hero-height" style={{
        width: "100%",
        position: "relative",
        overflow: "hidden",
        background: "var(--secondary-900)",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/suchmodus-oper-scene.jpg"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />

        {/* Filter bar */}
        <div className="hero-filterbar">
          <Link href="/results" style={{
            flex: 1,
            height: 60,
            padding: "0 24px",
            background: "var(--primary-900)",
            borderRadius: 61,
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}>
            <Image src="/icons/icon-filter.svg" alt="" width={24} height={24} style={{ filter: "invert(1)" }} />
            <span className="text-subtitle-1" style={{ color: "#FFFFFF", fontWeight: "var(--font-weight-500)", whiteSpace: "nowrap" }}>
              Kostüm finden
            </span>
          </Link>

          <Link href="/results" style={{
            width: 60, height: 60, flexShrink: 0,
            background: "#FFFFFF",
            border: "1px solid var(--primary-900)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Image src="/icons/icon-location.svg" alt="Standort" width={24} height={24} />
          </Link>

          <Link href="/search" style={{
            width: 60, height: 60, flexShrink: 0,
            background: "#FFFFFF",
            border: "1px solid var(--primary-900)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Image src="/icons/icon-search.svg" alt="Suche" width={24} height={24} />
          </Link>
        </div>

        {/* Hero text */}
        <div className="hero-text">
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
      <div className="suchmodus-padding">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "stretch" }}>
          <div className="gender-row">
            {GENDER_CARDS.slice(0, 3).map((c) => <GenderCard key={c.label} {...c} />)}
          </div>
          <div className="gender-row">
            {GENDER_CARDS.slice(3).map((c) => <GenderCard key={c.label} {...c} />)}
          </div>
        </div>
      </div>

      {/* ═══ Bekleidungsart ═══ */}
      <div style={{ background: "var(--accent-01)" }} className="suchmodus-padding">
        <div className="suchmodus-section-title"><SectionTitle>Bekleidungsart</SectionTitle></div>
        <TileRow>
          {BEKLEIDUNGSART_TILES.map((t) => <CategoryTile key={t.label} {...t} />)}
        </TileRow>
      </div>

      {/* ═══ CTA Event Card ═══ */}
      <div className="suchmodus-padding">
        <div style={{
          borderRadius: 30,
          overflow: "hidden",
          position: "relative",
          minHeight: 350,
          background: "var(--secondary-700)",
        }}>
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
      <div className="suchmodus-padding-bottom">
        <div className="suchmodus-section-title" style={{ paddingBottom: 0 }}><SectionTitle>Epoche</SectionTitle></div>
        <TileRow>
          {EPOCHE_TILES.map((t) => <CategoryTile key={t.label} {...t} />)}
        </TileRow>
      </div>

      {/* ═══ Sparte ═══ */}
      <div className="suchmodus-padding-bottom">
        <div className="suchmodus-section-title"><SectionTitle>Sparte</SectionTitle></div>
        <TileRow>
          {SPARTE_TILES.map((t) => <CategoryTile key={t.label} {...t} />)}
        </TileRow>
      </div>

      {/* ═══ Arbeitsuniformen ═══ */}
      <div className="suchmodus-padding-bottom">
        <div className="suchmodus-section-title"><SectionTitle>Arbeitsuniformen</SectionTitle></div>
        <TileRow>
          {BEKLEIDUNGSART2_TILES.map((t) => <CategoryTile key={t.label} {...t} />)}
        </TileRow>
      </div>

      {/* ═══ Kostüm Netzwerk ═══ */}
      <div className="suchmodus-padding">
        <h2 className="text-h1 text-h1--medium" style={{ color: "var(--neutral-grey-600)", textAlign: "center", marginBottom: 48 }}>
          Kostüm Netzwerk
        </h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {networkTheaters.map(({ name, slug, settings }) => (
            <Link key={slug} href={`/netzwerk/${slug}`} className="network-oval" style={{
              background: settings?.brand_color ?? "var(--secondary-900)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              flexShrink: 0,
              overflow: "hidden",
              position: "relative",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
              <span className="text-h6" style={{
                position: "relative",
                zIndex: 1,
                fontWeight: "var(--font-weight-700)",
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
