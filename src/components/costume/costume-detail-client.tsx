"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { ImageCarousel } from "@/components/costume/image-carousel";
import { CostumeSpecs } from "@/components/costume/costume-specs";
import { SimilarCostumes } from "@/components/costume/similar-costumes";
import { ContextMenu } from "@/components/ui/context-menu";
import { DeleteConfirmationSheet } from "@/components/ui/delete-confirmation-sheet";
import { MerklisteAddModal } from "@/components/suchmodus/merkliste-add-modal";
import { CostumeActivityLog } from "@/components/costume/costume-activity-log";
import { createClient } from "@/lib/supabase/client";
import { deleteCostume } from "@/lib/services/costume-service";
import { getGenderIcon } from "@/lib/constants/icons";
import { t } from "@/lib/i18n";
import type { Costume, TaxonomyTerm } from "@/lib/types/costume";

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "available",   label: "Verfügbar",   color: "var(--accent-01)"      },
  { value: "cleaning",    label: "Reinigung",   color: "var(--color-warning)"  },
  { value: "in_progress", label: "In Arbeit",   color: "var(--color-error)"    },
  { value: "rented",      label: "Ausgeliehen", color: "var(--color-error)"    },
  { value: "reserved",    label: "Reserviert",  color: "var(--color-error)"    },
  { value: "stage",       label: "Bühne",       color: "var(--color-error)"    },
  { value: "rehearsal",   label: "Probebühne",  color: "var(--color-error)"    },
  { value: "sorted_out",  label: "Aussortiert", color: "var(--color-error)"    },
  { value: "sold",        label: "Verkauft",    color: "var(--color-error)"    },
];

type CostumeDetailClientProps = {
  costume: Costume;
  taxonomyByVocabulary: Record<string, TaxonomyTerm[]>;
  ensembleChildren: Costume[];
  similarCostumes: Costume[];
};

export function CostumeDetailClient({
  costume,
  taxonomyByVocabulary,
  ensembleChildren,
  similarCostumes,
}: CostumeDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const firstItem = costume.costume_items?.[0];
  const firstProvenance = costume.costume_provenance?.[0];

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [autoBookmark, setAutoBookmark] = useState<{ wishlistId: string } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ wishlistId: string } | null>(null);
  const lastUsedWishlist = useRef<{ id: string; name: string } | null>(null);
  const bookmarkWishlistEntry = useRef<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => {
      setToastMsg(null);
      setAutoBookmark(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  const isAvailable = firstItem?.current_status === "available";
  const statusOption = STATUS_OPTIONS.find(o => o.value === firstItem?.current_status);

  async function handleDelete() {
    setDeleting(true);
    try {
      const mediaPaths = (costume.costume_media ?? []).map((m) => m.storage_path);
      await deleteCostume(supabase, costume.id, mediaPaths);
      router.push("/fundus");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
      setDeleting(false);
      setShowDeleteSheet(false);
    }
  }

  async function handleBookmark() {
    if (isBookmarked) {
      const entry = bookmarkWishlistEntry.current;
      if (!entry) return;
      setIsBookmarked(false);
      bookmarkWishlistEntry.current = null;
      setAutoBookmark(null);
      setToastMsg(`Von ${entry.name} entfernt`);
      await supabase.from("wishlist_items").delete()
        .eq("wishlist_id", entry.id).eq("costume_id", costume.id);
      return;
    }
    if (lastUsedWishlist.current) {
      const target = lastUsedWishlist.current;
      setIsBookmarked(true);
      bookmarkWishlistEntry.current = target;
      setAutoBookmark({ wishlistId: target.id });
      setToastMsg(`Zu ${target.name} hinzugefügt`);
      await supabase.from("wishlist_items").insert({ wishlist_id: target.id, costume_id: costume.id });
      return;
    }
    setShowBookmarkModal(true);
  }

  function handleModalSuccess(wishlistName: string, wishlistId: string) {
    setIsBookmarked(true);
    bookmarkWishlistEntry.current = { id: wishlistId, name: wishlistName };
    lastUsedWishlist.current = { id: wishlistId, name: wishlistName };
    setShowBookmarkModal(false);
    setToastMsg(`Zu ${wishlistName} hinzugefügt`);
  }

  function handleMoveClick() {
    if (!autoBookmark) return;
    setMoveTarget(autoBookmark);
    setToastMsg(null);
  }

  function handleMoveSuccess(wishlistName: string, wishlistId: string) {
    bookmarkWishlistEntry.current = { id: wishlistId, name: wishlistName };
    setMoveTarget(null);
    lastUsedWishlist.current = { id: wishlistId, name: wishlistName };
    setToastMsg(`Zu ${wishlistName} verschoben`);
  }

  const menuItems = [
    { label: t("common.edit"),   action: () => { setMenuOpen(false); router.push(`/kostueme/neu?edit=${costume.id}`); } },
    { label: "Änderungshistorie", action: () => { setMenuOpen(false); setShowHistory(true); } },
    { label: t("common.delete"), action: () => { setMenuOpen(false); setShowDeleteSheet(true); }, danger: true },
  ];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", paddingBottom: 48 }}>

        {/* Breadcrumb bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 32px 16px",
        }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer", padding: 0,
                fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)",
                color: "var(--neutral-grey-600)",
              }}
            >
              <Image src="/icons/icon-arrow-left.svg" alt="" width={14} height={14} />
              {t("costume.back")}
            </button>
            <span style={{ color: "var(--neutral-grey-300)", fontSize: "var(--font-size-300)" }}>|</span>
            {costume.gender_term && (
              <>
                <Link href={`/fundus?gender=${encodeURIComponent(costume.gender_term.label_de)}`}
                  style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-500)", textDecoration: "none" }}>
                  {costume.gender_term.label_de}
                </Link>
                <span style={{ color: "var(--neutral-grey-400)", fontSize: "var(--font-size-150)" }}>›</span>
              </>
            )}
            {costume.clothing_type && (
              <>
                <Link href={`/fundus?clothingType=${encodeURIComponent(costume.clothing_type.label_de)}`}
                  style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-500)", textDecoration: "none" }}>
                  {costume.clothing_type.label_de}
                </Link>
                <span style={{ color: "var(--neutral-grey-400)", fontSize: "var(--font-size-150)" }}>›</span>
              </>
            )}
            <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--neutral-grey-700)", fontWeight: 500 }}>
              {costume.name}
            </span>
          </nav>

          <ContextMenu
            items={menuItems}
            isOpen={menuOpen}
            onToggle={() => setMenuOpen((o) => !o)}
            onClose={() => setMenuOpen(false)}
          />
        </div>

        {/* Error banner */}
        {actionError && (
          <div style={{
            margin: "0 32px 12px", padding: "8px 12px",
            background: "var(--color-error-light)", borderRadius: "var(--radius-xs)",
            fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", color: "var(--color-error)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            {actionError}
            <button type="button" onClick={() => setActionError(null)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", color: "var(--color-error)" }}>
              ✕
            </button>
          </div>
        )}

        {/* Hero: Image left | Info right (desktop) / stacked (mobile) */}
        <div style={isMobile ? {
          display: "flex", flexDirection: "column",
          padding: "0 0 32px",
        } : {
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
          padding: "0 32px 131px", alignItems: "stretch",
        }}>
          {/* Image carousel */}
          <ImageCarousel
            media={costume.costume_media ?? []}
            name={costume.name}
            height={isMobile ? "320px" : "480px"}
            objectFit="contain"
            className=""
          />

          {/* Info panel */}
          <div style={isMobile ? {
            display: "flex", flexDirection: "column", gap: 16,
            padding: "16px 16px 0",
          } : {
            display: "flex", flexDirection: "column",
          }}>

            {/* Category label + title */}
            <div style={{ marginBottom: isMobile ? 0 : 16 }}>
              {costume.clothing_type && (
                <p style={{
                  fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)",
                  color: "var(--neutral-grey-500)", margin: "0 0 6px",
                }}>
                  {costume.clothing_type.label_de}
                </p>
              )}
              <h1 style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-600)", fontWeight: 400,
                color: "var(--neutral-grey-700)", margin: 0, lineHeight: 1.2,
              }}>
                {costume.name}
              </h1>
            </div>

            {/* Spacer — desktop only */}
            {!isMobile && <div style={{ flex: 1 }} />}

            {/* Bottom section: icons, status, buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Gender | shirt | size row */}
            {(costume.gender_term || firstItem?.size_label) && (
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {costume.gender_term && (
                  <>
                    <GoldIcon src={`/icons/icon-${getGenderIcon(costume.gender_term.label_de)}.svg`} size={20} />
                    <Divider />
                  </>
                )}
                <GoldIcon src="/icons/icon-shirt.svg" size={20} />
                {intlSize(firstItem?.size_label) && (
                  <>
                    <Divider />
                    <span style={{
                      fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)",
                      color: "var(--primary-900)", fontWeight: 500,
                    }}>
                      {intlSize(firstItem?.size_label)}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Availability */}
            {firstItem && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: statusOption?.color ?? "var(--neutral-grey-400)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isAvailable && (
                    <Image src="/icons/icon-check.svg" alt="" width={10} height={10} style={{ filter: "invert(1)" }} />
                  )}
                </span>
                <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", color: "var(--neutral-grey-700)" }}>
                  {costume.theater ? `${costume.theater.name}, ` : ""}
                  {statusOption?.label ?? firstItem.current_status}
                </span>
              </div>
            )}

            {/* Actions: Teilen + Merken */}
            <div style={{ display: "flex", gap: 12 }}>
              <button style={{
                flex: 1, height: 52, borderRadius: "var(--radius-md)",
                background: "transparent", color: "var(--primary-900)",
                border: "1.5px solid var(--primary-900)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)",
                fontWeight: 500,
              }}>
                {t("costume.share")}
                <GoldIcon src="/icons/icon-share.svg" size={18} />
              </button>
              <button
                type="button"
                onClick={handleBookmark}
                style={{
                  flex: 1, height: 52, borderRadius: "var(--radius-md)",
                  background: isBookmarked ? "var(--primary-900)" : "transparent",
                  color: isBookmarked ? "var(--neutral-white)" : "var(--primary-900)",
                  border: "1.5px solid var(--primary-900)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)",
                  fontWeight: 500,
                }}
              >
                {t("costume.bookmark")}
                {isBookmarked
                  ? <Image src="/icons/icon-heart-1.svg" alt="" width={18} height={18} style={{ filter: "invert(1)" }} />
                  : <GoldIcon src="/icons/icon-heart.svg" size={18} />
                }
              </button>
            </div>

            </div>{/* end bottom section */}
          </div>
        </div>

        {/* Accordion specs — all closed by default */}
        <CostumeSpecs
          costume={costume}
          taxonomyByVocabulary={taxonomyByVocabulary}
          firstItem={firstItem ?? null}
          firstProvenance={firstProvenance ?? null}
        />

        {/* Ensemble children */}
        {ensembleChildren.length > 0 && (
          <section style={{ padding: "0 32px 24px" }}>
            <h2 style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-400)", fontWeight: 700, marginBottom: 12 }}>
              {t("costume.costumeParts")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ensembleChildren.map((child) => (
                <Link key={child.id} href={`/costume/${child.id}`}
                  style={{
                    padding: "10px 14px", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--neutral-grey-200)",
                    fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)", fontWeight: 500,
                    color: "var(--neutral-grey-700)", textDecoration: "none",
                  }}>
                  {child.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Similar costumes */}
        {similarCostumes.length > 0 && (
          <SimilarCostumes costumes={similarCostumes} />
        )}
      </div>

      {showDeleteSheet && (
        <DeleteConfirmationSheet
          itemName={costume.name}
          isDeleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteSheet(false)}
        />
      )}

      {showBookmarkModal && (
        <MerklisteAddModal
          costumeId={costume.id}
          onClose={() => setShowBookmarkModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {moveTarget && (
        <MerklisteAddModal
          costumeId={costume.id}
          moveFromWishlistId={moveTarget.wishlistId}
          onClose={() => setMoveTarget(null)}
          onSuccess={handleMoveSuccess}
        />
      )}

      {showHistory && (
        <CostumeActivityLog
          costumeId={costume.id}
          onClose={() => setShowHistory(false)}
        />
      )}

      {toastMsg && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          zIndex: 1000,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--secondary-900)", color: "var(--neutral-white)",
            borderRadius: "var(--radius-full)", padding: "10px 20px",
            fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", fontWeight: 500,
            boxShadow: "var(--shadow-300)",
          }}>
            <Image src="/icons/icon-checkmark.svg" alt="" width={16} height={16} />
            <span>{toastMsg}</span>
          </div>
          {autoBookmark && (
            <button
              type="button"
              onClick={handleMoveClick}
              style={{
                background: "var(--neutral-white)", color: "var(--secondary-900)",
                border: "1.5px solid var(--secondary-900)", borderRadius: "var(--radius-full)",
                padding: "8px 20px", cursor: "pointer",
                fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", fontWeight: 500,
                boxShadow: "var(--shadow-100)",
              }}
            >
              Verschieben nach...
            </button>
          )}
        </div>
      )}
    </>
  );
}

/** Gibt die internationale Grösse zurück (Teil vor "/"). "M / 38" → "M", "XL" → "XL" */
function intlSize(sizeLabel: string | null | undefined): string | null {
  if (!sizeLabel) return null;
  const part = sizeLabel.split("/")[0].trim();
  return part || null;
}

/** SVG-Icon eingefärbt in var(--primary-900) via CSS mask-image */
function GoldIcon({ src, size = 20 }: { src: string; size?: number }) {
  return (
    <span style={{
      display: "inline-block", flexShrink: 0,
      width: size, height: size,
      background: "var(--primary-900)",
      WebkitMaskImage: `url('${src}')`,
      maskImage: `url('${src}')`,
      WebkitMaskSize: "contain",
      maskSize: "contain",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
    }} />
  );
}

function Divider() {
  return <span style={{ width: 1, height: 20, background: "var(--neutral-grey-300)", flexShrink: 0 }} />;
}
