"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { SuchmodusHeader } from "@/components/suchmodus/suchmodus-header";
import { StandortSheet } from "@/components/suchmodus/standort-sheet";
import { SuchmodusFooter } from "@/components/suchmodus/suchmodus-footer";
import { MerklisteAddModal } from "@/components/suchmodus/merkliste-add-modal";
import type { NetworkTheater, GenderTerm } from "@/components/suchmodus/suchmodus-cockpit";
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

// ─── Card ────────────────────────────────────────────────────────────────────

function CostumeCard({
  costume,
  isBookmarked,
  onBookmark,
}: {
  costume: ResultCostume;
  isBookmarked: boolean;
  onBookmark: (id: string) => void;
}) {
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
          className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarkBtnActive : ""}`}
          aria-label="Merken"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(costume.id); }}
        >
          <Image
            src={isBookmarked ? "/icons/icon-heart-1.svg" : "/icons/icon-heart.svg"}
            alt=""
            width={18}
            height={18}
          />
        </button>
      </div>

      <div className={styles.cardInfo}>
        {costume.clothingTypeLabel && (
          <p className={styles.cardClothingType}>{costume.clothingTypeLabel}</p>
        )}
        <div className={styles.cardNameBlock}>
          <p className={styles.cardName}>{costume.name}</p>
          {costume.provenance && (
            <p className={styles.cardProvenance}>{costume.provenance}</p>
          )}
        </div>
        <div className={styles.cardAvailability}>
          <span className={`${styles.availDot} ${costume.isAvailable ? styles.available : styles.onRequest}`}>
            {costume.isAvailable && <Image src="/icons/icon-check.svg" alt="" width={10} height={10} />}
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

export function SuchmodusResultsClient({
  title,
  count,
  costumes,
  theaters = [],
  genderTerms = [],
}: {
  title: string;
  count: number;
  costumes: ResultCostume[];
  theaters?: NetworkTheater[];
  genderTerms?: GenderTerm[];
}) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [modalCostumeId, setModalCostumeId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [autoBookmark, setAutoBookmark] = useState<{ costumeId: string; wishlistId: string } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ costumeId: string; wishlistId: string } | null>(null);
  const lastUsedWishlist = useRef<{ id: string; name: string } | null>(null);
  // Maps costumeId → wishlist it was added to (für Entfernen)
  const bookmarkWishlistMap = useRef<Record<string, { id: string; name: string }>>({});
  const supabase = createClient();

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => {
      setToastMsg(null);
      setAutoBookmark(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  async function handleBookmark(costumeId: string) {
    // Bereits gemerkt → Kostüm von Merkliste entfernen
    if (bookmarkedIds.has(costumeId)) {
      const entry = bookmarkWishlistMap.current[costumeId];
      if (!entry) return;
      setBookmarkedIds((prev) => { const next = new Set(prev); next.delete(costumeId); return next; });
      delete bookmarkWishlistMap.current[costumeId];
      setAutoBookmark(null);
      setToastMsg(`Von ${entry.name} entfernt`);
      await supabase.from("wishlist_items").delete()
        .eq("wishlist_id", entry.id)
        .eq("costume_id", costumeId);
      return;
    }

    // Ab dem zweiten Bookmark: direkt auf die zuletzt genutzte Liste + "Verschieben"-Button zeigen
    if (lastUsedWishlist.current) {
      const target = lastUsedWishlist.current;
      setBookmarkedIds((prev) => new Set([...prev, costumeId]));
      bookmarkWishlistMap.current[costumeId] = target;
      setAutoBookmark({ costumeId, wishlistId: target.id });
      setToastMsg(`Zu ${target.name} hinzugefügt`);
      const { error } = await supabase.from("wishlist_items").insert({
        wishlist_id: target.id,
        costume_id: costumeId,
      });
      if (error && error.code !== "23505") {
        console.error("[Merkliste] auto-insert:", error);
      }
      return;
    }

    // Erstes Bookmark: Modal öffnen
    setModalCostumeId(costumeId);
  }

  function handleModalSuccess(wishlistName: string, wishlistId: string) {
    if (modalCostumeId) {
      setBookmarkedIds((prev) => new Set([...prev, modalCostumeId]));
      bookmarkWishlistMap.current[modalCostumeId] = { id: wishlistId, name: wishlistName };
    }
    lastUsedWishlist.current = { id: wishlistId, name: wishlistName };
    setModalCostumeId(null);
    setToastMsg(`Zu ${wishlistName} hinzugefügt`);
  }

  function handleMoveClick() {
    if (!autoBookmark) return;
    setMoveTarget(autoBookmark);
    setToastMsg(null);
  }

  function handleMoveSuccess(wishlistName: string, wishlistId: string) {
    if (moveTarget) {
      bookmarkWishlistMap.current[moveTarget.costumeId] = { id: wishlistId, name: wishlistName };
    }
    setMoveTarget(null);
    lastUsedWishlist.current = { id: wishlistId, name: wishlistName };
    setToastMsg(`Zu ${wishlistName} verschoben`);
  }

  return (
    <div className={styles.page}>

      {/* ═══ Header ═══ */}
      <SuchmodusHeader genderTerms={genderTerms} />

      {/* ═══ Filter bar ═══ */}
      <div className={styles.filterBar}>
        <Link href="/suchmodus/filter" className={styles.filterPill}>
          <Image src="/icons/icon-filter.svg" alt="" width={24} height={24} style={{ filter: "invert(1)" }} />
          <span className="text-subtitle-1" style={{ color: "var(--neutral-white)", fontWeight: "var(--font-weight-500)" }}>
            Kostümfilter
          </span>
        </Link>
        <StandortSheet theaters={theaters} />
        <Link href="/suchmodus/search" className={styles.filterCircle}>
          <Image src="/icons/icon-search.svg" alt="Suche" width={24} height={24} className={styles.filterCircleIcon} />
        </Link>
      </div>

      {/* ═══ Title ═══ */}
      <div className={styles.titleSection}>
        <div className={styles.titleRow}>
          <Link href="/suchmodus" className={styles.backBtn} aria-label="Zurück zur Suche">
            <Image src="/icons/icon-arrow-left.svg" alt="" width={20} height={20} />
          </Link>
          <h1 className={styles.pageTitle}>{title}</h1>
        </div>
        <p className={styles.pageCount}>{count.toLocaleString("de-CH")} Kostüme</p>
      </div>

      {/* ═══ Grid ═══ */}
      {costumes.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>Keine Kostüme gefunden</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {costumes.map((c) => (
            <CostumeCard
              key={c.id}
              costume={c}
              isBookmarked={bookmarkedIds.has(c.id)}
              onBookmark={handleBookmark}
            />
          ))}
        </div>
      )}

      {/* ═══ Footer ═══ */}
      <SuchmodusFooter />

      {/* ═══ Modals ═══ */}
      {modalCostumeId && (
        <MerklisteAddModal
          costumeId={modalCostumeId}
          onClose={() => setModalCostumeId(null)}
          onSuccess={handleModalSuccess}
        />
      )}
      {moveTarget && (
        <MerklisteAddModal
          costumeId={moveTarget.costumeId}
          moveFromWishlistId={moveTarget.wishlistId}
          onClose={() => setMoveTarget(null)}
          onSuccess={handleMoveSuccess}
        />
      )}

      {/* ═══ Toast + Verschieben-Button ═══ */}
      {toastMsg && (
        <div className={styles.bottomNotification}>
          <div className={styles.toast}>
            <span className={styles.toastIcon}>
              <Image src="/icons/icon-checkmark.svg" alt="" width={16} height={16} />
            </span>
            <span className={styles.toastText}>{toastMsg}</span>
          </div>
          {autoBookmark && (
            <button type="button" className={styles.moveBtn} onClick={handleMoveClick}>
              Verschieben nach...
            </button>
          )}
        </div>
      )}

    </div>
  );
}
