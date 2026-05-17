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
import { getGenderIcon, getClothingTypeIcon } from "@/lib/constants/icons";
import { t } from "@/lib/i18n";
import type { Costume, TaxonomyTerm } from "@/lib/types/costume";
import styles from "./costume-detail-client.module.css";

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "available", label: "Verfügbar", color: "var(--accent-01)" },
  { value: "rented", label: "Ausgeliehen", color: "var(--color-error)" },
  { value: "cleaning", label: "Reinigung", color: "var(--color-warning)" },
  { value: "in_repair", label: "In Reparatur", color: "var(--color-error)" },
  { value: "reserved", label: "Reserviert", color: "var(--color-error)" },
  { value: "stage", label: "Bühne", color: "var(--color-error)" },
  { value: "rehearsal", label: "Probebühne", color: "var(--color-error)" },
  { value: "sorted_out", label: "Aussortiert", color: "var(--color-error)" },
  { value: "sold", label: "Verkauft", color: "var(--color-error)" },
];

type CostumeDetailClientProps = {
  costume: Costume;
  taxonomyByVocabulary: Record<string, TaxonomyTerm[]>;
  ensembleChildren: Costume[];
  similarCostumes: Costume[];
  currentUserName?: string;
};

export function CostumeDetailClient({
  costume,
  taxonomyByVocabulary,
  ensembleChildren,
  similarCostumes,
  currentUserName = "",
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

  const itemId = firstItem?.id ?? null;
  const [currentStatus, setCurrentStatus] = useState(firstItem?.current_status ?? "available");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusWrapRef = useRef<HTMLDivElement>(null);

  const [showShareModal, setShowShareModal] = useState(false);
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

  const statusOption = STATUS_OPTIONS.find((o) => o.value === currentStatus) ?? STATUS_OPTIONS[0];

  const theater = costume.theater;
  const mailTo = theater?.contact_email ?? "";
  const costumeUrl = `${typeof window !== "undefined" ? window.location.origin : "https://app.palcopiu.com"}/costume/${costume.id}`;
  const mailSubject = `Kostümanfrage: ${costume.name}${theater ? ` – ${theater.name}` : ""}`;
  const mailBodyLines: string[] = [
    `Guten Tag${theater?.contact_name ? ` ${theater.contact_name}` : ""},`,
    "",
    `ich bin auf palcoPiù auf das folgende Kostüm aufmerksam geworden und würde mich über eine Ausleihe freuen:`,
    "",
    `Kostüm:  ${costume.name}`,
  ];
  if (theater) mailBodyLines.push(`Theater: ${theater.name}`);
  mailBodyLines.push(
    `Link:    ${costumeUrl}`,
    "",
    `Ist das Kostüm verfügbar? Über eine kurze Rückmeldung würde ich mich sehr freuen.`,
    "",
    "Freundliche Grüsse",
    currentUserName,
  );
  const mailBody = mailBodyLines.join("\r\n");
  const mailtoHref = `mailto:${mailTo}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

  async function handleStatusChange(value: string) {
    setCurrentStatus(value);
    setStatusMenuOpen(false);
    if (itemId) {
      await supabase.from("costume_items").update({ current_status: value }).eq("id", itemId);
    }
  }

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
      await supabase
        .from("wishlist_items")
        .delete()
        .eq("wishlist_id", entry.id)
        .eq("costume_id", costume.id);
      return;
    }
    if (lastUsedWishlist.current) {
      const target = lastUsedWishlist.current;
      setIsBookmarked(true);
      bookmarkWishlistEntry.current = target;
      setAutoBookmark({ wishlistId: target.id });
      setToastMsg(`Zu ${target.name} hinzugefügt`);
      await supabase
        .from("wishlist_items")
        .insert({ wishlist_id: target.id, costume_id: costume.id });
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
    {
      label: t("common.edit"),
      action: () => {
        setMenuOpen(false);
        router.push(`/kostueme/neu?edit=${costume.id}`);
      },
    },
    {
      label: "Änderungshistorie",
      action: () => {
        setMenuOpen(false);
        setShowHistory(true);
      },
    },
    {
      label: t("common.delete"),
      action: () => {
        setMenuOpen(false);
        setShowDeleteSheet(true);
      },
      danger: true,
    },
  ];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", paddingBottom: 48 }}>
        {/* ── Breadcrumb bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "12px 16px" : "20px 32px 16px",
          }}
        >
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              minWidth: 0,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-150)",
                color: "var(--neutral-grey-600)",
                flexShrink: 0,
              }}
            >
              <Image src="/icons/icon-arrow-left.svg" alt="" width={14} height={14} />
              {t("costume.back")}
            </button>
            {(costume.gender_term || costume.clothing_type) && (
              <span
                style={{
                  color: "var(--neutral-grey-300)",
                  fontSize: "var(--font-size-300)",
                  flexShrink: 0,
                }}
              >
                |
              </span>
            )}
            {costume.gender_term && (
              <>
                <Link
                  href={`/fundus?gender=${encodeURIComponent(costume.gender_term.label_de)}`}
                  style={{
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-150)",
                    color: "var(--neutral-grey-500)",
                    textDecoration: "none",
                    flexShrink: 0,
                  }}
                >
                  {costume.gender_term.label_de}
                </Link>
                <span
                  style={{
                    color: "var(--neutral-grey-400)",
                    fontSize: "var(--font-size-150)",
                    flexShrink: 0,
                  }}
                >
                  ›
                </span>
              </>
            )}
            {costume.clothing_type && (
              <>
                <Link
                  href={`/fundus?clothingType=${encodeURIComponent(costume.clothing_type.label_de)}`}
                  style={{
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-150)",
                    color: "var(--neutral-grey-500)",
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {costume.clothing_type.label_de}
                </Link>
                {!isMobile && (
                  <>
                    <span
                      style={{
                        color: "var(--neutral-grey-400)",
                        fontSize: "var(--font-size-150)",
                        flexShrink: 0,
                      }}
                    >
                      ›
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-150)",
                        color: "var(--neutral-grey-700)",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {costume.name}
                    </span>
                  </>
                )}
              </>
            )}
          </nav>

          <ContextMenu
            items={menuItems}
            isOpen={menuOpen}
            onToggle={() => setMenuOpen((o) => !o)}
            onClose={() => setMenuOpen(false)}
          />
        </div>

        {/* ── Error banner ── */}
        {actionError && (
          <div
            style={{
              margin: `0 ${isMobile ? 16 : 32}px 12px`,
              padding: "8px 12px",
              background: "var(--color-error-light)",
              borderRadius: "var(--radius-xs)",
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-150)",
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
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0 4px",
                color: "var(--color-error)",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {isMobile ? (
          /* ── MOBILE LAYOUT ── */
          <>
            {/* Image — full bleed with heart overlay */}
            <div style={{ position: "relative" }}>
              <ImageCarousel
                media={costume.costume_media ?? []}
                name={costume.name}
                height="280px"
                objectFit="cover"
                className=""
                radius={0}
                dotsPosition="below"
              />
              {/* Heart overlay */}
              <button
                type="button"
                onClick={handleBookmark}
                aria-label={isBookmarked ? "Aus Merkliste entfernen" : "Zur Merkliste hinzufügen"}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "var(--neutral-white)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  zIndex: 5,
                }}
              >
                <Image
                  src={isBookmarked ? "/icons/icon-heart-1.svg" : "/icons/icon-heart.svg"}
                  alt=""
                  width={18}
                  height={18}
                  style={isBookmarked ? {} : { opacity: 0.75 }}
                />
              </button>
            </div>

            {/* Info section */}
            <div
              style={{
                padding: "16px 16px 32px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Category label */}
              {costume.clothing_type && (
                <p
                  style={{
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-150)",
                    color: "var(--neutral-grey-500)",
                    margin: 0,
                  }}
                >
                  {costume.clothing_type.label_de}
                </p>
              )}

              {/* Title */}
              <h1 className={styles.costumeTitle} style={{ marginBottom: 8 }}>
                {costume.name}
              </h1>

              {/* Gender | shirt | size + Status dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {costume.gender_term && (
                  <>
                    <GoldIcon
                      src={`/icons/icon-${getGenderIcon(costume.gender_term.label_de)}.svg`}
                      size={20}
                    />
                    <Divider />
                  </>
                )}
                <GoldIcon src={`/icons/${getClothingTypeIcon(costume.clothing_type?.label_de)}.svg`} size={20} />
                {firstItem?.size_label && (
                  <>
                    <Divider />
                    <span
                      style={{
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-200)",
                        color: "var(--primary-900)",
                        fontWeight: 500,
                      }}
                    >
                      {firstItem.size_label}
                    </span>
                  </>
                )}
                <Divider />
                <div className={styles.statusWrap} ref={statusWrapRef}>
                  <button
                    type="button"
                    className={styles.statusTrigger}
                    onClick={() => setStatusMenuOpen((v) => !v)}
                  >
                    <span className={styles.statusDot} style={{ background: statusOption.color }} />
                    <span>{statusOption.label}</span>
                    <span className={styles.statusArrow} />
                  </button>
                  {statusMenuOpen && (
                    <>
                      <div className={styles.statusBackdrop} onClick={() => setStatusMenuOpen(false)} />
                      <div className={styles.statusMenuDown}>
                        {STATUS_OPTIONS.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => handleStatusChange(o.value)}
                            className={`${styles.statusOption} ${o.value === currentStatus ? styles.statusOptionActive : ""}`}
                          >
                            <span className={styles.statusDot} style={{ background: o.color }} />
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Teilen | Merken */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  style={{
                    flex: 1,
                    height: 62,
                    borderRadius: "var(--radius-md)",
                    background: "transparent",
                    color: "var(--primary-900)",
                    border: "1.5px solid var(--primary-900)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-300)",
                    fontWeight: 500,
                  }}
                >
                  {t("costume.share")}
                  <GoldIcon src="/icons/icon-share.svg" size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleBookmark}
                  style={{
                    flex: 1,
                    height: 62,
                    borderRadius: "var(--radius-md)",
                    background: isBookmarked ? "var(--primary-900)" : "transparent",
                    color: isBookmarked ? "var(--neutral-white)" : "var(--primary-900)",
                    border: "1.5px solid var(--primary-900)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-300)",
                    fontWeight: 500,
                  }}
                >
                  {t("costume.bookmark")}
                  {isBookmarked ? (
                    <Image
                      src="/icons/icon-heart-1.svg"
                      alt=""
                      width={18}
                      height={18}
                      style={{ filter: "invert(1)" }}
                    />
                  ) : (
                    <GoldIcon src="/icons/icon-heart.svg" size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Accordions */}
            <CostumeSpecs
              costume={costume}
              taxonomyByVocabulary={taxonomyByVocabulary}
              firstItem={firstItem ?? null}
              firstProvenance={firstProvenance ?? null}
            />

            {/* Ensemble children */}
            {ensembleChildren.length > 0 && (
              <section style={{ padding: "0 16px 24px" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-350)",
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  {t("costume.costumeParts")}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ensembleChildren.map((child) => (
                    <Link
                      key={child.id}
                      href={`/costume/${child.id}`}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--neutral-grey-200)",
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-150)",
                        fontWeight: 500,
                        color: "var(--neutral-grey-700)",
                        textDecoration: "none",
                      }}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Similar costumes */}
            {similarCostumes.length > 0 && <SimilarCostumes costumes={similarCostumes} />}
          </>
        ) : (
          /* ── DESKTOP / TABLET LAYOUT ── */
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 40,
                padding: "0 32px 48px",
                alignItems: "start",
              }}
            >
              {/* Image carousel — square, cover */}
              <div style={{ aspectRatio: "1 / 1", width: "100%", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                <ImageCarousel
                  media={costume.costume_media ?? []}
                  name={costume.name}
                  height="100%"
                  objectFit="cover"
                  className=""
                />
              </div>

              {/* Info panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                {/* Category label + title */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {costume.clothing_type && (
                    <p
                      style={{
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-200)",
                        color: "var(--neutral-grey-500)",
                        margin: 0,
                      }}
                    >
                      {costume.clothing_type.label_de}
                    </p>
                  )}
                  <h1 className={styles.costumeTitle}>
                    {costume.name}
                  </h1>
                </div>

                {/* Bottom section */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Gender | shirt | size + Status dropdown */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    {costume.gender_term && (
                      <>
                        <GoldIcon
                          src={`/icons/icon-${getGenderIcon(costume.gender_term.label_de)}.svg`}
                          size={20}
                        />
                        <Divider />
                      </>
                    )}
                    <GoldIcon src={`/icons/${getClothingTypeIcon(costume.clothing_type?.label_de)}.svg`} size={20} />
                    {firstItem?.size_label && (
                      <>
                        <Divider />
                        <span
                          style={{
                            fontFamily: "var(--font-family-base)",
                            fontSize: "var(--font-size-200)",
                            color: "var(--primary-900)",
                            fontWeight: 500,
                          }}
                        >
                          {firstItem.size_label}
                        </span>
                      </>
                    )}
                    <Divider />
                    <div className={styles.statusWrap}>
                      <button
                        type="button"
                        className={styles.statusTrigger}
                        onClick={() => setStatusMenuOpen((v) => !v)}
                      >
                        <span className={styles.statusDot} style={{ background: statusOption.color }} />
                        <span>{statusOption.label}</span>
                        <span className={styles.statusArrow} />
                      </button>
                      {statusMenuOpen && (
                        <>
                          <div className={styles.statusBackdrop} onClick={() => setStatusMenuOpen(false)} />
                          <div className={styles.statusMenuDown}>
                            {STATUS_OPTIONS.map((o) => (
                              <button
                                key={o.value}
                                type="button"
                                onClick={() => handleStatusChange(o.value)}
                                className={`${styles.statusOption} ${o.value === currentStatus ? styles.statusOptionActive : ""}`}
                              >
                                <span className={styles.statusDot} style={{ background: o.color }} />
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Teilen | Merken */}
                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      style={{
                        flex: 1,
                        height: 62,
                        borderRadius: "var(--radius-md)",
                        background: "transparent",
                        color: "var(--primary-900)",
                        border: "1.5px solid var(--primary-900)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-300)",
                        fontWeight: 500,
                      }}
                    >
                      {t("costume.share")}
                      <GoldIcon src="/icons/icon-share.svg" size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleBookmark}
                      style={{
                        flex: 1,
                        height: 62,
                        borderRadius: "var(--radius-md)",
                        background: isBookmarked ? "var(--primary-900)" : "transparent",
                        color: isBookmarked ? "var(--neutral-white)" : "var(--primary-900)",
                        border: "1.5px solid var(--primary-900)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-300)",
                        fontWeight: 500,
                      }}
                    >
                      {t("costume.bookmark")}
                      {isBookmarked ? (
                        <Image
                          src="/icons/icon-heart-1.svg"
                          alt=""
                          width={18}
                          height={18}
                          style={{ filter: "invert(1)" }}
                        />
                      ) : (
                        <GoldIcon src="/icons/icon-heart.svg" size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion specs */}
            <CostumeSpecs
              costume={costume}
              taxonomyByVocabulary={taxonomyByVocabulary}
              firstItem={firstItem ?? null}
              firstProvenance={firstProvenance ?? null}
            />

            {/* Ensemble children */}
            {ensembleChildren.length > 0 && (
              <section style={{ padding: "0 32px 24px" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-400)",
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  {t("costume.costumeParts")}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ensembleChildren.map((child) => (
                    <Link
                      key={child.id}
                      href={`/costume/${child.id}`}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--neutral-grey-200)",
                        fontFamily: "var(--font-family-base)",
                        fontSize: "var(--font-size-150)",
                        fontWeight: 500,
                        color: "var(--neutral-grey-700)",
                        textDecoration: "none",
                      }}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Similar costumes */}
            {similarCostumes.length > 0 && <SimilarCostumes costumes={similarCostumes} />}
          </>
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
        <CostumeActivityLog costumeId={costume.id} onClose={() => setShowHistory(false)} />
      )}

      {showShareModal && (
        <ShareModal
          costumeUrl={costumeUrl}
          costumeName={costume.name}
          mailtoHref={mailtoHref}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--secondary-900)",
              color: "var(--neutral-white)",
              borderRadius: "var(--radius-full)",
              padding: "10px 20px",
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-200)",
              fontWeight: 500,
              boxShadow: "var(--shadow-300)",
            }}
          >
            <Image src="/icons/icon-checkmark.svg" alt="" width={16} height={16} />
            <span>{toastMsg}</span>
          </div>
          {autoBookmark && (
            <button
              type="button"
              onClick={handleMoveClick}
              style={{
                background: "var(--neutral-white)",
                color: "var(--secondary-900)",
                border: "1.5px solid var(--secondary-900)",
                borderRadius: "var(--radius-full)",
                padding: "8px 20px",
                cursor: "pointer",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-200)",
                fontWeight: 500,
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

function ShareModal({
  costumeUrl,
  costumeName,
  mailtoHref,
  onClose,
}: {
  costumeUrl: string;
  costumeName: string;
  mailtoHref: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(costumeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${costumeName} – ${costumeUrl}`)}`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 200, backdropFilter: "blur(2px)",
        }}
      />
      {/* Sheet */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--neutral-white)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          padding: "24px 24px 40px",
          zIndex: 201,
          display: "flex", flexDirection: "column", gap: 12,
          maxWidth: 540, margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)", fontWeight: 500 }}>
            Teilen
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
          >
            <Image src="/icons/icon-close-small.svg" alt="Schliessen" width={20} height={20} />
          </button>
        </div>

        {/* Copy link */}
        <ShareRow
          icon="/icons/icon-share.svg"
          label={copied ? "Link kopiert!" : "Link kopieren"}
          onClick={handleCopy}
        />

        {/* WhatsApp */}
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <ShareRow icon="/icons/icon-whatsapp.svg" label="WhatsApp" />
        </a>

        {/* E-Mail */}
        <a href={mailtoHref} style={{ textDecoration: "none" }}>
          <ShareRow icon="/icons/icon-mail.svg" label="E-Mail" />
        </a>
      </div>
    </>
  );
}

function ShareRow({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 16,
        width: "100%", background: "none", border: "none",
        cursor: "pointer", padding: "12px 0",
        borderBottom: "1px solid var(--neutral-grey-100)",
        fontFamily: "var(--font-family-base)",
        fontSize: "var(--font-size-300)",
        color: "var(--neutral-grey-700)",
        textAlign: "left",
      }}
    >
      <span style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "var(--neutral-grey-100)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Image src={icon} alt="" width={20} height={20} />
      </span>
      {label}
    </button>
  );
}

function GoldIcon({ src, size = 20 }: { src: string; size?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        flexShrink: 0,
        width: size,
        height: size,
        background: "var(--primary-900)",
        WebkitMaskImage: `url('${src}')`,
        maskImage: `url('${src}')`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

function Divider() {
  return (
    <span style={{ width: 1, height: 20, background: "var(--neutral-grey-300)", flexShrink: 0 }} />
  );
}
