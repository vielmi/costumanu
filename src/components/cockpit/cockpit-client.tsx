"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { RecentCostume } from "@/components/cockpit/cockpit-shell";

interface CockpitContentProps {
  recentCostumes: RecentCostume[];
  theaterId: string | null;
}

const IMAGE_CARDS = [
  {
    title: "Kostüm Übersicht",
    href: "/fundus",
    overlayOpacity: 0.35,
    bg: "var(--secondary-800)",
    image: "/images/cockpit-kostueme.jpg",
  },
  {
    title: "Aktuelle- & vergangene Aufführungen",
    href: "/auffuehrungen",
    overlayOpacity: 0.45,
    bg: "var(--secondary-900)",
    image: "/images/cockpit-auffuehrungen.jpg",
  },
  {
    title: "Darsteller & Masse",
    href: "/darsteller",
    overlayOpacity: 0.35,
    bg: "var(--tertiary-900)",
    image: "/images/cockpit-darsteller.jpg",
  },
];

function getStatusFromItems(items: RecentCostume["costume_items"]): "available" | "unavailable" | "in-progress" {
  if (!items || items.length === 0) return "available";
  const statuses = items.map((i) => i.current_status);
  if (statuses.every((s) => s === "available")) return "available";
  if (statuses.some((s) => s === "rented")) return "unavailable";
  return "in-progress";
}

function StatusDot({ status }: { status: "available" | "unavailable" | "in-progress" }) {
  const color =
    status === "available"
      ? "var(--accent-01)"
      : status === "unavailable"
      ? "var(--color-error)"
      : "var(--color-warning)";
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        display: "inline-block",
      }}
    />
  );
}

function CostumeRow({ costume, isActive }: { costume: RecentCostume; isActive: boolean }) {
  const supabase = createClient();
  const firstMedia = costume.costume_media?.[0];
  const firstProvenance = costume.costume_provenance?.[0];
  const status = getStatusFromItems(costume.costume_items);

  const imageUrl = firstMedia
    ? supabase.storage.from("costume-images").getPublicUrl(firstMedia.storage_path).data.publicUrl
    : null;

  const productionLabel = firstProvenance
    ? firstProvenance.year
      ? `${firstProvenance.production_title}, ${firstProvenance.year}`
      : firstProvenance.production_title
    : "—";

  return (
    <Link
      href={`/costume/${costume.id}`}
      style={{
        width: "100%",
        height: 70,
        borderRadius: "var(--radius-xs)",
        background: isActive ? "var(--secondary-500)" : "var(--neutral-grey-100)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 16px 0 12px",
        position: "relative",
        textDecoration: "none",
        flexShrink: 0,
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 5,
            height: 70,
            background: "var(--accent-01)",
            borderRadius: "4px 0 0 4px",
          }}
        />
      )}

      {/* Drag handle */}
      <Image
        src="/icons/icon-more.svg"
        alt=""
        width={20}
        height={20}
        style={{ flexShrink: 0, opacity: 0.4 }}
      />

      {/* Avatar */}
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: "100px",
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--neutral-grey-300)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={costume.name}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        ) : (
          <Image
            src="/icons/icon-shirt.svg"
            alt=""
            width={24}
            height={24}
            style={{ opacity: 0.4 }}
          />
        )}
      </div>

      {/* ID + Name */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontSize: 10,
            color: "var(--neutral-grey-500)",
            fontFamily: "var(--font-family-base)",
          }}
        >
          ID-{costume.id.slice(0, 9).toUpperCase()}
        </span>
        <span
          style={{
            fontSize: "var(--font-size-200)",
            fontWeight: "var(--font-weight-500)",
            color: "#000000",
            fontFamily: "var(--font-family-base)",
            letterSpacing: "0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {costume.name}
        </span>
      </div>

      {/* Production */}
      <span
        style={{
          fontSize: "var(--font-size-200)",
          color: "var(--neutral-grey-600)",
          fontFamily: "var(--font-family-base)",
          flexShrink: 0,
          minWidth: 120,
          maxWidth: 160,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {productionLabel}
      </span>

      {/* Icon badge */}
      <div
        style={{
          border: "1px solid var(--neutral-grey-300)",
          borderRadius: "var(--radius-md)",
          height: 40,
          padding: "0 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <Image
          src={`/icons/icon-${
            costume.gender_term?.label_de === "Herren"
              ? "male"
              : costume.gender_term?.label_de === "Damen"
              ? "female"
              : "unisex"
          }.svg`}
          alt={costume.gender_term?.label_de ?? ""}
          width={16}
          height={16}
        />
        <div style={{ width: "0.8px", height: 20, background: "var(--neutral-grey-300)" }} />
        <Image src="/icons/icon-shirt.svg" alt="" width={16} height={16} />
      </div>

      {/* Status dot */}
      <StatusDot status={status} />
    </Link>
  );
}

export function CockpitContent({ recentCostumes }: CockpitContentProps) {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ─── Image Cards ─── */}
      <div style={{ display: "flex", gap: 12 }}>
        {IMAGE_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              flex: 1,
              height: 180,
              borderRadius: "var(--radius-md)",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              background: card.bg,
              textDecoration: "none",
              display: "block",
              minWidth: 0,
            }}
          >
            {/* Background image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `rgba(0,0,0,${card.overlayOpacity})`,
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: 16,
                left: 20,
                right: 44,
                fontSize: "var(--font-size-400)",
                fontWeight: "var(--font-weight-500)",
                color: "#FFFFFF",
                fontFamily: "var(--font-family-base)",
                lineHeight: "var(--line-height-150)",
              }}
            >
              {card.title}
            </span>
            <div
              style={{
                position: "absolute",
                bottom: 20,
                right: 16,
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src="/icons/icon-arrow-right-2.svg"
                alt=""
                width={26}
                height={26}
                style={{ filter: "invert(1)" }}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* ─── Zuletzt bearbeitete Kostüme ─── */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-400)",
            fontWeight: "var(--font-weight-500)",
            color: "var(--neutral-grey-700)",
            marginBottom: 16,
          }}
        >
          Zuletzt bearbeitete{" "}
          <span style={{ fontWeight: "var(--font-weight-700)", textDecoration: "underline" }}>
            Kostüme
          </span>
        </h2>

        {/* List + CTA side by side */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

          {/* Costume list */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {recentCostumes.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-300)",
                  color: "var(--neutral-grey-500)",
                }}
              >
                Noch keine Kostüme erfasst.{" "}
                <Link href="/fundus/neu" style={{ color: "var(--primary-900)" }}>
                  Jetzt erstes Kostüm erfassen
                </Link>
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentCostumes.map((costume, index) => (
                  <CostumeRow key={costume.id} costume={costume} isActive={index === 0} />
                ))}
              </div>
            )}
          </div>

          {/* CTA Card "Suchmodus öffnen" — text top, + bottom */}
          <Link
            href="/search"
            style={{
              width: 187,
              height: 245,
              borderRadius: "var(--radius-md)",
              position: "relative",
              overflow: "hidden",
              background: "var(--tertiary-900)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cockpit-search.jpg"
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                padding: "0 16px",
              }}
            >
              {/* Text on top */}
              <span
                style={{
                  fontSize: "var(--font-size-400)",
                  fontWeight: "var(--font-weight-500)",
                  color: "#FFFFFF",
                  fontFamily: "var(--font-family-base)",
                  textAlign: "center",
                  lineHeight: "var(--line-height-150)",
                }}
              >
                Suchmodus öffnen
              </span>
              {/* Plus circle below */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  border: "1px solid #FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  src="/icons/icon-plus-m.svg"
                  alt=""
                  width={24}
                  height={24}
                  style={{ filter: "invert(1)" }}
                />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Legacy export for any existing imports
export { CockpitContent as CockpitClient };
