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
  { label: "Schauspiel", image: "/images/suchmodus-schauspiel.jpg", href: "/results?sparte=schauspiel" },
  { label: "Oper",       image: "/images/suchmodus-oper.jpg",       href: "/results?sparte=oper"       },
];

const BEKLEIDUNGSART2_TILES = [
  { label: "Polizei",   image: "/images/suchmodus-polizei.jpg",   href: "/results?type=polizei"   },
  { label: "Reinigung", image: "/images/suchmodus-reinigung.jpg", href: "/results?type=reinigung" },
  { label: "Feuerwehr", image: "/images/suchmodus-feuerwehr.jpg", href: "/results?type=feuerwehr" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryTile({ label, image, href }: { label: string; image?: string; href: string }) {
  return (
    <Link
      href={href}
      style={{
        flex: 1,
        minHeight: 430,
        borderRadius: 20,
        position: "relative",
        overflow: "hidden",
        background: "var(--secondary-900)",
        display: "block",
        textDecoration: "none",
      }}
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
      <div style={{ position: "absolute", bottom: 40, left: 44, display: "flex", alignItems: "center", gap: 20 }}>
        <span className="text-h2 text-h1--medium" style={{ color: "#FFFFFF" }}>
          {label}
        </span>
        <Image
          src="/icons/icon-arrow-right-2.svg"
          alt=""
          width={43}
          height={43}
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
        width: 226,
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
        flexShrink: 0,
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

// ─── Main component ───────────────────────────────────────────────────────────

export function SuchmodusCockpit({ networkTheaters = [] }: { networkTheaters?: NetworkTheater[] }) {

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh" }}>

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
      <div style={{
        width: "100%",
        height: 668,
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
        <div style={{
          position: "absolute",
          top: 42,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <Link href="/results" style={{
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
            width: 60, height: 60,
            background: "#FFFFFF",
            border: "1px solid var(--primary-900)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Image src="/icons/icon-location.svg" alt="Standort" width={24} height={24} />
          </Link>

          <Link href="/search" style={{
            width: 60, height: 60,
            background: "#FFFFFF",
            border: "1px solid var(--primary-900)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Image src="/icons/icon-search.svg" alt="Suche" width={24} height={24} />
          </Link>
        </div>

        {/* Hero text — clamp bleibt inline da kein passender Utility-Token */}
        <div style={{ position: "absolute", bottom: 80, left: 74, maxWidth: 573 }}>
          <h1 className="text-h1--medium" style={{
            fontSize: "clamp(36px, 5.3vw, 60px)",
            color: "#FFFFFF",
            lineHeight: "var(--line-height-120)",
            margin: 0,
          }}>
            Der Kostüm-Finder für die Film- & Theaterbranche
          </h1>
        </div>
      </div>

      {/* ═══ Gender Cards ═══ */}
      <div style={{ padding: "60px 67px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 30, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 30 }}>
            {GENDER_CARDS.slice(0, 3).map((c) => <GenderCard key={c.label} {...c} />)}
          </div>
          <div style={{ display: "flex", gap: 30 }}>
            {GENDER_CARDS.slice(3).map((c) => <GenderCard key={c.label} {...c} />)}
          </div>
        </div>
      </div>

      {/* ═══ Bekleidungsart — grüne Sektion ═══ */}
      <div style={{ background: "var(--accent-01)", padding: "60px 67px" }}>
        <SectionTitle>Bekleidungsart</SectionTitle>
        <div style={{ display: "flex", gap: 30 }}>
          {BEKLEIDUNGSART_TILES.map((t) => <CategoryTile key={t.label} {...t} />)}
        </div>
      </div>

      {/* ═══ CTA Event Card ═══ */}
      <div style={{ padding: "60px 67px" }}>
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

          <div style={{ position: "relative", zIndex: 1, padding: "40px 60px" }}>
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
                style={{ filter: "invert(62%) sepia(40%) saturate(500%) hue-rotate(5deg)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Epoche ═══ */}
      <div style={{ padding: "0 67px 60px" }}>
        <SectionTitle>Epoche</SectionTitle>
        <div style={{ display: "flex", gap: 30 }}>
          {EPOCHE_TILES.map((t) => <CategoryTile key={t.label} {...t} />)}
        </div>
      </div>

      {/* ═══ Sparte ═══ */}
      <div style={{ padding: "0 67px 60px" }}>
        <SectionTitle>Sparte</SectionTitle>
        <div style={{ display: "flex", gap: 30 }}>
          {SPARTE_TILES.map((t) => <CategoryTile key={t.label} {...t} />)}
        </div>
      </div>

      {/* ═══ Bekleidungsart (spezifisch) ═══ */}
      <div style={{ padding: "0 67px 60px" }}>
        <SectionTitle>Bekleidungsart</SectionTitle>
        <div style={{ display: "flex", gap: 30 }}>
          {BEKLEIDUNGSART2_TILES.map((t) => <CategoryTile key={t.label} {...t} />)}
        </div>
      </div>

      {/* ═══ Kostüm Netzwerk ═══ */}
      <div style={{ padding: "60px 67px" }}>
        <h2 className="text-h1 text-h1--medium" style={{ color: "var(--neutral-grey-600)", textAlign: "center", marginBottom: 48 }}>
          Kostüm Netzwerk
        </h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {networkTheaters.map(({ name, slug, settings }) => (
            <Link key={slug} href={`/netzwerk/${slug}`} style={{
              width: 255,
              height: 381,
              borderRadius: 166,
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
