"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AppMobileHeader } from "@/components/layout/app-mobile-header";
import { MerklisteAddModal } from "@/components/suchmodus/merkliste-add-modal";
import styles from "./wishlist-page-client.module.css";

type Wishlist = {
  id: string;
  name: string;
  is_archived: boolean;
  created_at: string;
  item_count: number;
  coverUrl: string | null;
};

type Props = {
  wishlists: Wishlist[];
  theaterId: string;
  userId: string;
};

const heartRightSlot = (
  <Link href="/wishlist" className={styles.headerHeart} aria-label="Merklisten">
    <Image src="/icons/icon-heart-1.svg" alt="" width={22} height={22} />
  </Link>
);

export function WishlistPageClient({ wishlists: initial, theaterId, userId }: Props) {
  const [wishlists, setWishlists] = useState(initial);
  const [showModal, setShowModal] = useState(false);

  function handleSuccess(wishlistName: string, wishlistId: string) {
    setShowModal(false);
    setWishlists((prev) => [
      {
        id: wishlistId,
        name: wishlistName,
        is_archived: false,
        created_at: new Date().toISOString(),
        item_count: 0,
        coverUrl: null,
      },
      ...prev,
    ]);
  }

  return (
    <div className={styles.page}>
      <AppMobileHeader rightSlot={heartRightSlot} />

      {/* ── Page title ── */}
      <p className={styles.pageTitle}>Meine Merklisten</p>

      {/* ── Body ── */}
      <div className={`${styles.body} ${wishlists.length > 0 ? styles.bodyFilled : ""}`}>
        {wishlists.length === 0 ? (
          <p className={styles.emptyText}>
            Noch nichts gemerkt?{"\n"}Deine Bühne wartet – und die Kostüme auch 🎭✨
          </p>
        ) : (
          <div className={styles.list}>
            {wishlists.map((w) => (
              <Link key={w.id} href={`/wishlist/${w.id}`} className={styles.listItem}>
                <div className={styles.listItemThumb}>
                  {w.coverUrl ? (
                    <Image
                      src={w.coverUrl}
                      alt=""
                      width={70}
                      height={70}
                      className={styles.listItemThumbImg}
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/images/wishlist-default.svg"
                      alt=""
                      width={70}
                      height={70}
                      className={styles.listItemThumbImg}
                    />
                  )}
                </div>
                <div className={styles.listItemInfo}>
                  <span className={styles.listItemName}>{w.name}</span>
                  <span className={styles.listItemCount}>
                    {w.item_count} {w.item_count === 1 ? "Kostüm" : "Kostüme"}
                  </span>
                </div>
                <Image src="/icons/icon-arrow-s.svg" alt="" width={15} height={15} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom action ── */}
      <div className={`${styles.bottomAction} ${wishlists.length > 0 ? styles.bottomActionFilled : ""}`}>
        <button
          type="button"
          className={styles.createBtn}
          onClick={() => setShowModal(true)}
        >
          Merkliste erstellen
        </button>
      </div>

      {showModal && (
        <MerklisteAddModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
