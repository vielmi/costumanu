"use client";

import { useState } from "react";
import Image from "next/image";

type Status = "active" | "done";

type Production = {
  title: string;
  year: string;
  status: Status;
  image: string | null;
};

type Season = {
  year: string;
  defaultOpen: boolean;
  productions: Production[];
};

const MOCK_SEASONS: Season[] = [
  {
    year: "2025/2026",
    defaultOpen: true,
    productions: [
      { title: "Resonanzen",                     year: "2025/2026", status: "active", image: "/images/suchmodus-tanz.jpg" },
      { title: "Gods' Dawn",                     year: "2025/2026", status: "active", image: "/images/suchmodus-oper.jpg" },
      { title: "Hello Earth!",                   year: "2025/2026", status: "active", image: "/images/suchmodus-barock-scene.jpg" },
      { title: "Gilgamesch, mein Sternenschiff", year: "2025/2026", status: "active", image: "/images/cockpit-auffuehrungen.jpg" },
      { title: "Die Glasmenagerie",              year: "2025/2026", status: "active", image: "/images/suchmodus-oper-scene.jpg" },
    ],
  },
  {
    year: "2024/2025",
    defaultOpen: true,
    productions: [
      { title: "Der Kirschgarten",        year: "2024/2025", status: "done", image: "/images/suchmodus-barock-scene.jpg" },
      { title: "Die Dreigroschenoper",    year: "2024/2025", status: "done", image: "/images/suchmodus-schauspiel.jpg" },
    ],
  },
  { year: "2023/2024", defaultOpen: false, productions: [] },
  { year: "2022/2023", defaultOpen: false, productions: [] },
  { year: "2021/2022", defaultOpen: false, productions: [] },
  { year: "2020/2021", defaultOpen: false, productions: [] },
];

function StatusBadge({ status }: { status: Status }) {
  if (status === "active") {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "var(--overlay-medium)",
        borderRadius: "var(--radius-full)", padding: "5px 10px",
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-warning)", flexShrink: 0 }} />
        <span style={{
          fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-100)",
          fontWeight: 500, color: "var(--neutral-white)", whiteSpace: "nowrap",
        }}>
          in Produktion
        </span>
      </div>
    );
  }
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      border: "1.5px solid rgba(255,255,255,0.75)",
      borderRadius: "var(--radius-full)", padding: "5px 12px",
    }}>
      <span style={{
        fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-100)",
        fontWeight: 500, color: "var(--neutral-white)", whiteSpace: "nowrap",
      }}>
        Abgeschlossen
      </span>
    </div>
  );
}

function ThreeDotButton() {
  return (
    <button style={{
      width: 32, height: 32, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--overlay-light)", border: "none", borderRadius: "50%",
      cursor: "pointer",
    }}>
      <Image src="/icons/icon-more.svg" alt="Optionen" width={18} height={18} style={{ filter: "invert(1)" }} />
    </button>
  );
}

function ProductionCard({ production }: { production: Production }) {
  return (
    <div style={{
      borderRadius: "var(--radius-md)", overflow: "hidden",
      position: "relative", height: 240,
      background: production.status === "active" ? "var(--secondary-800)" : "var(--secondary-900)",
      cursor: "pointer",
    }}>
      {production.image && (
        <Image src={production.image} alt={production.title} fill style={{ objectFit: "cover" }} />
      )}
      {production.image && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)",
        }} />
      )}

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 14 }}>
        <div>
          <p style={{
            margin: 0, fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-400)", fontWeight: 700,
            color: "var(--neutral-white)", lineHeight: 1.2,
          }}>
            {production.title}
          </p>
          <p style={{
            margin: "6px 0 0", fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-200)", fontWeight: 400,
            color: "rgba(255,255,255,0.7)",
          }}>
            {production.year}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
          <StatusBadge status={production.status} />
          <ThreeDotButton />
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label, icon }: { label: string; icon: string }) {
  return (
    <button style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      height: 38, padding: "0 14px", borderRadius: "var(--radius-full)",
      border: "1px solid var(--neutral-grey-300)", background: "var(--neutral-white)",
      cursor: "pointer", fontFamily: "var(--font-family-base)",
      fontSize: "var(--font-size-200)", fontWeight: 400,
      color: "var(--neutral-grey-700)", whiteSpace: "nowrap",
    }}>
      {label}
      <Image src={`/icons/${icon}.svg`} alt="" width={16} height={16} style={{ opacity: 0.6 }} />
    </button>
  );
}

function SeasonSection({ season }: { season: Season }) {
  const [open, setOpen] = useState(season.defaultOpen);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: "flex", alignItems: "center",
        borderBottom: "1px solid var(--neutral-grey-200)",
        paddingBottom: 12, marginBottom: open && season.productions.length > 0 ? 16 : 0,
      }}>
        <span style={{
          flex: 1, fontFamily: "var(--font-family-base)",
          fontSize: "var(--font-size-350)", fontWeight: "var(--font-weight-600)" as React.CSSProperties["fontWeight"],
          color: "var(--neutral-grey-700)",
        }}>
          {season.year}
        </span>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--neutral-grey-500)", flexShrink: 0, borderRadius: "var(--radius-xs)",
          }}
        >
          {open
            ? <Image src="/icons/icon-close-medium.svg" alt="Schliessen" width={18} height={18} style={{ opacity: 0.5 }} />
            : <span style={{ fontSize: "var(--font-size-500)", lineHeight: 1, fontWeight: "var(--font-weight-300)" as React.CSSProperties["fontWeight"], color: "var(--neutral-grey-500)" }}>+</span>
          }
        </button>
      </div>

      {open && season.productions.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {season.productions.map((p, i) => (
            <ProductionCard key={i} production={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProduktionenClient() {
  return (
    <div style={{ padding: "32px 32px 48px" }}>
      {/* Heading */}
      <h1 style={{
        margin: "0 0 24px",
        fontFamily: "var(--font-family-base)",
        fontSize: "var(--font-size-600)",
        fontWeight: 700,
        color: "var(--neutral-grey-700)",
      }}>
        Produktionen
      </h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
        <FilterPill label="Produktionsjahr" icon="icon-calendar-menu" />
        <FilterPill label="Sparte" icon="icon-arrow-dropdown-down" />
      </div>

      {/* Seasons */}
      {MOCK_SEASONS.map((season) => (
        <SeasonSection key={season.year} season={season} />
      ))}
    </div>
  );
}
