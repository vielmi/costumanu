"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppMobileHeader } from "@/components/layout/app-mobile-header";
import { BarcodeScanner } from "@/components/barcode/barcode-scanner";
import type { WishlistCostume } from "@/app/wishlist/[id]/page";
import styles from "./wishlist-detail.module.css";

const STATUS_OPTIONS = [
  { value: "available",  label: "Verfügbar",    color: "var(--accent-01)" },
  { value: "rented",     label: "Ausgeliehen",  color: "var(--color-error)" },
  { value: "cleaning",   label: "Reinigung",    color: "var(--color-warning)" },
  { value: "in_repair",  label: "In Reparatur", color: "var(--color-error)" },
  { value: "reserved",   label: "Reserviert",   color: "var(--color-error)" },
  { value: "stage",      label: "Bühne",        color: "var(--color-error)" },
  { value: "rehearsal",  label: "Probebühne",   color: "var(--color-error)" },
  { value: "sorted_out", label: "Aussortiert",  color: "var(--color-error)" },
  { value: "sold",       label: "Verkauft",     color: "var(--color-error)" },
];

type Props = {
  wishlistId: string;
  wishlistName: string;
  costumes: WishlistCostume[];
};

export function WishlistDetailClient({ wishlistId, wishlistName: initialName, costumes: initialCostumes }: Props) {
  const [showScanner, setShowScanner] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [wishlistName, setWishlistName] = useState(initialName);
  const [renameValue, setRenameValue] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState(initialCostumes);
  const [statusFilter, setStatusFilter] = useState("");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  function handleEditStart() {
    setShowMenu(false);
    setIsEditing(true);
    setSelectedIds(new Set());
    setStatusFilter("");
    setFilterMenuOpen(false);
  }

  function toggleSelect(itemId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  async function handleRemoveItem(itemId: string) {
    await supabase.from("wishlist_items").delete().eq("id", itemId);
    setItems((prev) => prev.filter((c) => c.itemId !== itemId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }

  async function handleRename() {
    const trimmed = renameValue.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("wishlists")
      .update({ name: trimmed })
      .eq("id", wishlistId);
    if (!error) {
      setWishlistName(trimmed);
      setShowRename(false);
    } else {
      console.error("[Wishlist] rename:", error);
    }
    setIsSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Merkliste "${wishlistName}" wirklich löschen?`)) return;
    await supabase.from("wishlist_items").delete().eq("wishlist_id", wishlistId);
    await supabase.from("wishlists").delete().eq("id", wishlistId);
    router.push("/wishlist");
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: wishlistName, url: window.location.href }).catch(() => null);
    }
    setShowMenu(false);
  }

  function handleBulkShare() {
    const selected = items.filter((c) => selectedIds.has(c.itemId));
    const text = selected.map((c) => `${c.name} (${c.shortId})`).join("\n");
    if (navigator.share) {
      navigator.share({ title: wishlistName, text, url: window.location.href }).catch(() => null);
    }
  }

  async function handleStatusSelect(value: string) {
    setFilterMenuOpen(false);

    if (!value) {
      setStatusFilter("");
      return;
    }

    if (selectedIds.size > 0) {
      const selectedCostumeIds = items
        .filter((c) => selectedIds.has(c.itemId))
        .map((c) => c.id);

      const { error } = await supabase
        .from("costume_items")
        .update({ current_status: value })
        .in("costume_id", selectedCostumeIds);

      if (error) {
        console.error("[Wishlist] bulk status update:", error);
        return;
      }

      setItems((prev) =>
        prev.map((c) => (selectedIds.has(c.itemId) ? { ...c, status: value } : c))
      );
      setSelectedIds(new Set());
      setStatusFilter("");
    } else {
      setStatusFilter(value);
    }
  }

  const displayedItems =
    isEditing && statusFilter
      ? items.filter((c) => c.status === statusFilter || selectedIds.has(c.itemId))
      : statusFilter
      ? items.filter((c) => c.status === statusFilter)
      : items;

  const selectedFilterOption = STATUS_OPTIONS.find((o) => o.value === statusFilter) ?? null;

  const rightSlot = (
    <div className={styles.headerIcons}>
      <button
        type="button"
        className={styles.headerIconBtn}
        aria-label="Kostüm scannen"
        onClick={() => setShowScanner(true)}
      >
        <Image src="/icons/icon-camera.svg" alt="" width={22} height={22} />
      </button>
      <Link href="/wishlist" className={styles.headerIconBtn} aria-label="Merklisten">
        <Image src="/icons/icon-heart.svg" alt="" width={22} height={22} />
      </Link>
    </div>
  );

  return (
    <div className={styles.page}>
      <AppMobileHeader rightSlot={rightSlot} />

      {/* ── Titel + 3-Punkte-Menü / Fertig ── */}
      <div className={styles.titleBar}>
        <h1 className={styles.title}>{wishlistName}</h1>

        {isEditing ? (
          <button
            type="button"
            className={styles.fertigBtn}
            onClick={() => setIsEditing(false)}
          >
            Fertig
          </button>
        ) : (
          <div className={styles.menuWrap} ref={menuRef}>
            <button
              type="button"
              className={styles.moreBtn}
              aria-label="Mehr Optionen"
              onClick={() => setShowMenu((v) => !v)}
            >
              <Image src="/icons/icon-more.svg" alt="" width={24} height={24} />
            </button>

            {showMenu && (
              <div className={styles.menuDropdown}>
                <button type="button" className={styles.menuItem} onClick={handleShare}>
                  <span>Teilen</span>
                  <Image src="/icons/icon-share.svg" alt="" width={22} height={22} />
                </button>
                <div className={styles.menuDivider} />
                <button type="button" className={styles.menuItem} onClick={handleEditStart}>
                  <span>Bearbeiten</span>
                  <Image src="/icons/icon-edit.svg" alt="" width={22} height={22} />
                </button>
                <div className={styles.menuDivider} />
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    setShowMenu(false);
                    setRenameValue(wishlistName);
                    setShowRename(true);
                  }}
                >
                  <span>Umbenennen</span>
                  <span className={styles.menuIconText}>Tt</span>
                </button>
                <div className={styles.menuDivider} />
                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.menuItemDelete}`}
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                >
                  <span>Löschen</span>
                  <Image src="/icons/icon-delete.svg" alt="" width={22} height={22} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Kostüm-Liste ── */}
      {items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Noch keine Kostüme auf dieser Liste.</p>
        </div>
      ) : (
        <div className={`${styles.list} ${isEditing ? styles.listEditPadding : ""}`}>
          {displayedItems.map((c, i) => {
            const statusOpt = STATUS_OPTIONS.find((o) => o.value === c.status) ?? null;
            return (
              <div key={c.itemId}>
                {isEditing ? (
                  <div className={styles.itemEdit}>
                    <div className={styles.thumb} style={{ alignSelf: "flex-start" }}>
                      {c.imageUrl ? (
                        <Image
                          src={c.imageUrl}
                          alt=""
                          width={75}
                          height={100}
                          className={styles.thumbImg}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.thumbPlaceholder} />
                      )}
                    </div>

                    <div className={styles.infoEdit}>
                      <div className={styles.meta}>
                        <span className={styles.label}>
                          {c.shortId}
                          {c.clothingTypeLabel ? ` / ${c.clothingTypeLabel}` : ""}
                        </span>
                        <span className={styles.name}>{c.name}</span>
                        {c.storageLocation && (
                          <span className={styles.location}>{c.storageLocation}</span>
                        )}
                      </div>
                      {statusOpt && (
                        <div className={styles.statusBadge}>
                          <span
                            className={styles.statusDot}
                            style={{ background: statusOpt.color }}
                          />
                          <span className={styles.statusLabel}>{statusOpt.label}</span>
                          {c.theaterName && (
                            <span className={styles.theaterName}>{c.theaterName}</span>
                          )}
                        </div>
                      )}
                      <div className={styles.editActionsRow}>
                        <button
                          type="button"
                          className={styles.editActionBtn}
                          aria-label="Entfernen"
                          onClick={() => handleRemoveItem(c.itemId)}
                        >
                          <Image src="/icons/icon-delete.svg" alt="" width={20} height={20} />
                        </button>
                        <div className={styles.editActionSep} />
                        <button
                          type="button"
                          className={styles.editActionBtn}
                          aria-label="Teilen"
                          onClick={() => {
                            if (navigator.share) {
                              navigator
                                .share({ title: c.name, url: window.location.href })
                                .catch(() => null);
                            }
                          }}
                        >
                          <Image src="/icons/icon-share.svg" alt="" width={20} height={20} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`${styles.itemCheckbox} ${selectedIds.has(c.itemId) ? styles.itemCheckboxChecked : ""}`}
                      onClick={() => toggleSelect(c.itemId)}
                      aria-label={selectedIds.has(c.itemId) ? "Abwählen" : "Auswählen"}
                    >
                      {selectedIds.has(c.itemId) && (
                        <span className={styles.itemCheckboxInner} />
                      )}
                    </button>
                  </div>
                ) : (
                  <Link href={`/costume/${c.id}`} className={styles.item}>
                    <div className={styles.thumb}>
                      {c.imageUrl ? (
                        <Image
                          src={c.imageUrl}
                          alt=""
                          width={75}
                          height={100}
                          className={styles.thumbImg}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.thumbPlaceholder} />
                      )}
                    </div>
                    <div className={styles.info}>
                      <div className={styles.meta}>
                        <span className={styles.label}>
                          {c.shortId}
                          {c.clothingTypeLabel ? ` / ${c.clothingTypeLabel}` : ""}
                        </span>
                        <span className={styles.name}>{c.name}</span>
                        {c.storageLocation && (
                          <span className={styles.location}>{c.storageLocation}</span>
                        )}
                      </div>
                      {statusOpt && (
                        <div className={styles.statusBadge}>
                          <span
                            className={styles.statusDot}
                            style={{ background: statusOpt.color }}
                          />
                          <span className={styles.statusLabel}>{statusOpt.label}</span>
                          {c.theaterName && (
                            <span className={styles.theaterName}>{c.theaterName}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                )}
                {i < displayedItems.length - 1 && <div className={styles.divider} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit bottom bar ── */}
      {isEditing && (
        <div className={styles.editBottomBar}>
          {/* Status filter dropdown */}
          <div className={styles.statusFilterWrap}>
            {filterMenuOpen && (
              <>
                <div
                  className={styles.statusBackdrop}
                  onClick={() => setFilterMenuOpen(false)}
                />
                <div className={styles.statusFilterMenu}>
                  <button
                    type="button"
                    className={styles.statusOption}
                    onClick={() => handleStatusSelect("")}
                  >
                    <span
                      className={styles.statusDotMenu}
                      style={{ background: "var(--neutral-grey-300)" }}
                    />
                    Alle
                  </button>
                  {STATUS_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={`${styles.statusOption} ${o.value === statusFilter ? styles.statusOptionActive : ""}`}
                      onClick={() => handleStatusSelect(o.value)}
                    >
                      <span
                        className={styles.statusDotMenu}
                        style={{ background: o.color }}
                      />
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button
              type="button"
              className={`${styles.statusFilterBtn} ${statusFilter ? styles.statusFilterBtnActive : ""}`}
              onClick={() => setFilterMenuOpen((v) => !v)}
            >
              <span
                className={styles.statusDot}
                style={{
                  background: selectedFilterOption
                    ? selectedFilterOption.color
                    : "var(--neutral-grey-300)",
                }}
              />
              <span className={styles.statusFilterLabel}>
                {selectedIds.size > 0
                  ? "Status setzen"
                  : selectedFilterOption
                  ? selectedFilterOption.label
                  : "Status"}
              </span>
              <Image
                src="/icons/icon-arrow-dropdown-down.svg"
                alt=""
                width={18}
                height={18}
              />
            </button>
          </div>

          <div className={styles.editBtnRow}>
            <button
              type="button"
              className={styles.editBtnShare}
              onClick={handleBulkShare}
            >
              <span>Teilen</span>
              <Image src="/icons/icon-share.svg" alt="" width={18} height={18} className={styles.editIconGold} />
            </button>
            <button type="button" className={styles.editBtnAnfragen}>
              <span>Anfragen</span>
              <Image src="/icons/icon-mail.svg" alt="" width={18} height={18} className={styles.editIconWhite} />
            </button>
          </div>
        </div>
      )}

      {/* ── Umbenennen-Modal ── */}
      {showRename && (
        <div className={styles.renameBackdrop} onClick={() => setShowRename(false)}>
          <div className={styles.renameCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.renameHeader}>
              <h2 className={styles.renameTitle}>Umbenennen</h2>
              <button
                type="button"
                className={styles.renameClose}
                onClick={() => setShowRename(false)}
                aria-label="Schliessen"
              >
                <Image src="/icons/icon-close-medium.svg" alt="" width={24} height={24} />
              </button>
            </div>
            <div className={styles.renameInputWrap}>
              <input
                type="text"
                className={styles.renameInput}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
              />
            </div>
            <button
              type="button"
              className={`${styles.renameSaveBtn} ${renameValue.trim() ? styles.renameSaveBtnActive : ""}`}
              onClick={handleRename}
              disabled={!renameValue.trim() || isSaving}
            >
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* ── Scanner ── */}
      {showScanner && (
        <BarcodeScanner
          onDetected={(code) => {
            setShowScanner(false);
            void code;
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
