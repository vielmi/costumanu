"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteCostume, duplicateCostume } from "@/lib/services/costume-service";
import { getPublicUrl } from "@/lib/services/storage-service";
import { getGenderIcon } from "@/lib/constants/icons";
import { COCKPIT } from "@/lib/constants/layout";
import { ContextMenu } from "@/components/ui/context-menu";
import { DeleteConfirmationSheet } from "@/components/ui/delete-confirmation-sheet";
import styles from "./cockpit.module.css";
import type { RecentCostume } from "@/lib/services/costume-service";

interface CockpitContentProps {
  recentCostumes: RecentCostume[];
  theaterId: string | null;
}

const IMAGE_CARDS = [
  {
    title: "Kostüm Übersicht",
    href: "/fundus",
    overlayOpacity: 0.3,
    bg: "var(--secondary-800)",
    image: "/images/cockpit-kostueme.jpg",
  },
  {
    title: "Aktuelle- & vergangene Produktionen",
    href: "/produktionen",
    overlayOpacity: 0.5,
    bg: "var(--secondary-900)",
    image: "/images/cockpit-auffuehrungen.jpg",
  },
] as const;

type CostumeStatus = "available" | "unavailable" | "in-progress";

function getCostumeStatus(items: RecentCostume["costume_items"]): CostumeStatus {
  if (!items || items.length === 0) return "available";
  const statuses = items.map((i) => i.current_status);
  if (statuses.every((s) => s === "available")) return "available";
  if (statuses.some((s) => s === "rented")) return "unavailable";
  return "in-progress";
}

function formatProduction(provenance: RecentCostume["costume_provenance"][number] | undefined): string {
  if (!provenance) return "—";
  return provenance.year
    ? `${provenance.production_title}, ${provenance.year}`
    : provenance.production_title;
}

function StatusDot({ status }: { status: CostumeStatus }) {
  const colorMap: Record<CostumeStatus, string> = {
    available: "var(--accent-01)",
    unavailable: "var(--color-error)",
    "in-progress": "var(--color-warning)",
  };
  return (
    <span
      style={{
        width: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginLeft: "auto",
      }}
    >
      <span style={{
        width: 10, height: 10,
        borderRadius: "50%",
        background: colorMap[status],
        flexShrink: 0,
        display: "block",
      }} />
    </span>
  );
}

function CostumeRow({ costume, isActive }: { costume: RecentCostume; isActive: boolean }) {
  const supabase = createClient();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    try {
      const mediaPaths = (costume.costume_media ?? []).map((m) => m.storage_path);
      await deleteCostume(supabase, costume.id, mediaPaths);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
      setDeleting(false);
      setShowDeleteSheet(false);
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    setMenuOpen(false);
    try {
      await duplicateCostume(supabase, costume.id);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Duplizieren fehlgeschlagen");
    } finally {
      setDuplicating(false);
    }
  }

  const imageUrl = costume.costume_media?.[0]
    ? getPublicUrl(supabase, costume.costume_media[0].storage_path)
    : null;

  const status = getCostumeStatus(costume.costume_items);
  const productionLabel = formatProduction(costume.costume_provenance?.[0]);
  const genderIcon = getGenderIcon(costume.gender_term?.label_de);

  const menuItems = [
    { label: "Bearbeiten",  action: () => { setMenuOpen(false); router.push(`/kostueme/neu?edit=${costume.id}`); } },
    { label: "Duplizieren", action: handleDuplicate },
    { label: "Löschen",     action: () => { setMenuOpen(false); setShowDeleteSheet(true); }, danger: true },
  ];

  return (
    <>
      {actionError && (
        <div
          style={{
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

      <div
        className={styles.costumeRow}
        style={{
          display: "flex",
          alignItems: "stretch",
          height: 70,
          background: isActive ? "var(--secondary-500)" : "var(--neutral-grey-100)",
          flexShrink: 0,
          position: "relative",
          overflow: "visible",
        }}
      >
        {isActive && (
          <div
            style={{
              position: "absolute",
              left: 0, top: 0,
              width: 5, height: 70,
              background: "var(--accent-01)",
              borderRadius: "4px 0 0 4px",
              zIndex: 1,
            }}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", padding: "0 4px 0 12px", flexShrink: 0, position: "relative" }}>
          <ContextMenu
            items={menuItems}
            isOpen={menuOpen}
            onToggle={() => setMenuOpen((o) => !o)}
            onClose={() => setMenuOpen(false)}
            disabled={duplicating}
            align="left"
          />
        </div>

        <Link
          href={`/costume/${costume.id}`}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "0 16px 0 4px", textDecoration: "none" }}
        >
          {/* Thumbnail */}
          <div
            style={{
              width: 46, height: 46, borderRadius: "100px",
              overflow: "hidden", flexShrink: 0,
              background: "var(--neutral-grey-300)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={costume.name} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            ) : (
              <Image src="/icons/icon-shirt.svg" alt="" width={24} height={24} style={{ opacity: 0.4 }} />
            )}
          </div>

          {/* ID + Name */}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "var(--font-size-50)", color: "var(--neutral-grey-500)", fontFamily: "var(--font-family-base)" }}>
              ID-{costume.id.slice(0, 9).toUpperCase()}
            </span>
            <span
              style={{
                fontSize: "var(--font-size-200)", fontWeight: "var(--font-weight-500)",
                color: "var(--neutral-black)", fontFamily: "var(--font-family-base)",
                letterSpacing: "0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {costume.name}
            </span>
          </div>

          {/* Production — hidden on mobile */}
          <span
            className={styles.productionLabel}
            style={{
              fontSize: "var(--font-size-200)", color: "var(--neutral-grey-600)",
              fontFamily: "var(--font-family-base)", flexShrink: 0,
              minWidth: 120, maxWidth: 160,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {productionLabel}
          </span>

          {/* Gender / type badge — hidden on mobile */}
          <div
            className={styles.genderBadge}
            style={{
              border: "1px solid var(--neutral-grey-300)", borderRadius: "var(--radius-md)",
              height: 40, padding: "0 10px",
              alignItems: "center", gap: 8, flexShrink: 0,
            }}
          >
            <Image src={`/icons/icon-${genderIcon}.svg`} alt={costume.gender_term?.label_de ?? ""} width={16} height={16} />
            <div style={{ width: "0.8px", height: 20, background: "var(--neutral-grey-300)" }} />
            <Image src="/icons/icon-shirt.svg" alt="" width={16} height={16} />
          </div>

          <StatusDot status={status} />
        </Link>
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

// ─── Suchmodus CTA card (reusable) ───────────────────────────────────────────

function SuchmodusCta({ fullWidth }: { fullWidth?: boolean }) {
  return (
    <Link
      href="/suchmodus"
      style={{
        width: fullWidth ? "100%" : COCKPIT.CTA_CARD_WIDTH,
        height: fullWidth ? 110 : COCKPIT.CTA_CARD_HEIGHT,
        borderRadius: "var(--radius-md)",
        position: "relative", overflow: "hidden",
        background: "var(--tertiary-900)", textDecoration: "none",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/cockpit-search.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "var(--overlay-medium)" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: fullWidth ? "row" : "column", alignItems: "center", justifyContent: "center", gap: fullWidth ? 16 : 20, padding: "0 20px" }}>
        <span style={{ fontSize: "var(--font-size-400)", fontWeight: "var(--font-weight-500)", color: "var(--neutral-white)", fontFamily: "var(--font-family-base)", textAlign: "center", lineHeight: "var(--line-height-150)" }}>
          Suchmodus öffnen
        </span>
        <div style={{ width: fullWidth ? 40 : 60, height: fullWidth ? 40 : 60, borderRadius: "50%", border: "1px solid var(--neutral-white)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Image src="/icons/icon-plus-m.svg" alt="" width={fullWidth ? 18 : 24} height={fullWidth ? 18 : 24} style={{ filter: "invert(1)" }} />
        </div>
      </div>
    </Link>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function CockpitContent({ recentCostumes }: CockpitContentProps) {
  return (
    <div className={styles.contentPadding} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Image cards — horizontal scroll on mobile */}
      <div className={styles.imageCards}>
        {IMAGE_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              flex: 1,
              minWidth: 220,
              height: 180,
              borderRadius: "var(--radius-md)",
              position: "relative", overflow: "hidden",
              background: card.bg, textDecoration: "none", display: "block",
              scrollSnapAlign: "start",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${card.overlayOpacity})` }} />
            <span
              style={{
                position: "absolute", bottom: 16, left: 20, right: 44,
                fontSize: "var(--font-size-400)", fontWeight: "var(--font-weight-500)",
                color: "var(--neutral-white)", fontFamily: "var(--font-family-base)", lineHeight: "var(--line-height-150)",
              }}
            >
              {card.title}
            </span>
            <div style={{ position: "absolute", bottom: 20, right: 16, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image src="/icons/icon-arrow-right-2.svg" alt="" width={26} height={26} style={{ filter: "invert(1)" }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent costumes */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-350)",
            fontWeight: "var(--font-weight-500)", color: "var(--neutral-grey-700)", marginBottom: 16,
          }}
        >
          Zuletzt bearbeitete{" "}
          <span style={{ fontWeight: "var(--font-weight-700)", textDecoration: "underline" }}>Kostüme</span>
        </h2>

        {/* Suchmodus CTA — mobile: above list, full-width */}
        <div className={styles.suchmodusMobile} style={{ marginBottom: 16 }}>
          <SuchmodusCta fullWidth />
        </div>

        <div className={styles.recentRow}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {recentCostumes.length === 0 ? (
              <p style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)", color: "var(--neutral-grey-500)" }}>
                Noch keine Kostüme erfasst.{" "}
                <Link href="/kostueme/neu" style={{ color: "var(--primary-900)" }}>Jetzt erstes Kostüm erfassen</Link>
              </p>
            ) : (
              <div className={styles.costumeList}>
                {recentCostumes.map((costume, index) => (
                  <CostumeRow key={costume.id} costume={costume} isActive={index === 0} />
                ))}
              </div>
            )}
          </div>

          {/* Suchmodus CTA — desktop: right of list */}
          <div className={styles.suchmodusDesktop}>
            <SuchmodusCta />
          </div>
        </div>
      </div>
    </div>
  );
}

// Legacy export
export { CockpitContent as CockpitClient };
