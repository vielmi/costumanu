"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./merkliste-add-modal.module.css";

type Wishlist = { id: string; name: string; coverUrl: string | null };
type Status = "loading" | "create" | "select" | "saving" | "error";

type Props = {
  costumeId?: string;           // optional — wenn undefined nur Merkliste erstellen, kein Item hinzufügen
  moveFromWishlistId?: string;  // wenn gesetzt: Kostüm von dieser Liste verschieben (statt nur hinzufügen)
  onClose: () => void;
  onSuccess: (wishlistName: string, wishlistId: string) => void;
};

export function MerklisteAddModal({ costumeId, moveFromWishlistId, onClose, onSuccess }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [name, setName] = useState("");
  const [showCreateInSelect, setShowCreateInSelect] = useState(false);
  const isSelectFlow = useRef(moveFromWishlistId !== undefined);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onClose();
        router.push("/login");
        return;
      }
      const { data, error } = await supabase
        .from("wishlists")
        .select(`
          id, name,
          wishlist_items(
            costumes(costume_media(storage_path, sort_order))
          )
        `)
        .eq("owner_id", user.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) console.error("[Merkliste] wishlists fetch:", error);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list: Wishlist[] = (data ?? []).map((w: any) => {
        let coverUrl: string | null = null;
        const items = Array.isArray(w.wishlist_items) ? w.wishlist_items : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const item of items as any[]) {
          const media = item.costumes?.costume_media;
          if (Array.isArray(media) && media.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sorted = [...media].sort((a: any, b: any) => a.sort_order - b.sort_order);
            coverUrl = `${supabaseUrl}/storage/v1/object/public/costume-media/${sorted[0].storage_path}`;
            break;
          }
        }
        return { id: w.id, name: w.name, coverUrl };
      });

      setWishlists(list);
      if (list.length > 0 && (costumeId || moveFromWishlistId)) {
        isSelectFlow.current = true;
        setStatus("select");
      } else {
        setStatus("create");
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getOrBootstrapTheaterId(userId: string): Promise<string | null> {
    const { data: membership, error: memberErr } = await supabase
      .from("theater_members")
      .select("theater_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (memberErr) console.error("[Merkliste] theater_members fetch:", memberErr);
    if (membership) return membership.theater_id;

    const slug = `personal-${userId.slice(0, 8)}`;
    const { data: newId, error: bootstrapErr } = await supabase.rpc("bootstrap_personal_theater", {
      p_name: "Mein Fundus",
      p_slug: slug,
    });
    if (bootstrapErr) console.error("[Merkliste] bootstrap_personal_theater:", bootstrapErr);
    return newId ?? null;
  }

  async function handleAddToExisting(wishlist: Wishlist) {
    setStatus("saving");
    // Bei "Verschieben": zuerst von alter Liste entfernen
    if (moveFromWishlistId && costumeId) {
      await supabase.from("wishlist_items").delete()
        .eq("wishlist_id", moveFromWishlistId)
        .eq("costume_id", costumeId);
    }
    const { error } = await supabase.from("wishlist_items").insert({
      wishlist_id: wishlist.id,
      costume_id: costumeId,
    });
    // 23505 = duplicate key: Kostüm bereits in dieser Merkliste → trotzdem Erfolg
    if (error && error.code !== "23505") {
      console.error("[Merkliste] wishlist_items insert:", error);
      setStatus("error");
      return;
    }
    onSuccess(wishlist.name, wishlist.id);
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || status === "saving") return;
    setStatus("saving");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { onClose(); router.push("/login"); return; }

    const theaterId = await getOrBootstrapTheaterId(user.id);
    if (!theaterId) {
      console.error("[Merkliste] no theaterId — aborting");
      setStatus("error");
      return;
    }

    const { data: wishlist, error: wishlistErr } = await supabase
      .from("wishlists")
      .insert({ name: trimmed, theater_id: theaterId, owner_id: user.id })
      .select("id, name")
      .single();

    if (wishlistErr || !wishlist) {
      console.error("[Merkliste] wishlists insert:", wishlistErr);
      setStatus("error");
      return;
    }

    if (costumeId) {
      // Bei "Verschieben": zuerst von alter Liste entfernen
      if (moveFromWishlistId) {
        await supabase.from("wishlist_items").delete()
          .eq("wishlist_id", moveFromWishlistId)
          .eq("costume_id", costumeId);
      }
      const { error: itemErr } = await supabase.from("wishlist_items").insert({
        wishlist_id: wishlist.id,
        costume_id: costumeId,
      });
      if (itemErr && itemErr.code !== "23505") {
        console.error("[Merkliste] wishlist_items insert:", itemErr);
      }
    }
    onSuccess(wishlist.name, wishlist.id);
  }

  const isSaving = status === "saving";

  // ── Bottom sheet (Fall 2: mind. 1 Merkliste vorhanden) ──────────────────────
  if (isSelectFlow.current) {
    return (
      <div className={styles.sheetBackdrop} onClick={onClose}>
        <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className={styles.sheetHeader}>
            <h2 className={styles.title}>
              {moveFromWishlistId
                ? "Verschieben nach..."
                : showCreateInSelect
                  ? "Neue Merkliste erstellen"
                  : "Zur Merkliste hinzufügen"}
            </h2>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Schliessen">
              <Image src="/icons/icon-close-medium.svg" alt="" width={20} height={20} />
            </button>
          </div>

          {/* Merklisten-Liste */}
          {!showCreateInSelect && (
            <>
              <div className={styles.sheetList}>
                {wishlists.filter(w => w.id !== moveFromWishlistId).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className={styles.sheetRow}
                    onClick={() => handleAddToExisting(w)}
                    disabled={isSaving}
                  >
                    <div className={styles.sheetRowThumb}>
                      {w.coverUrl ? (
                        <Image
                          src={w.coverUrl}
                          alt=""
                          width={80}
                          height={80}
                          className={styles.sheetRowThumbImg}
                          unoptimized
                        />
                      ) : (
                        <Image
                          src="/images/wishlist-default.svg"
                          alt=""
                          width={80}
                          height={80}
                          className={styles.sheetRowThumbImg}
                        />
                      )}
                    </div>
                    <span className={styles.sheetRowName}>{w.name}</span>
                  </button>
                ))}
              </div>
              <div className={styles.sheetBottom}>
                <button
                  type="button"
                  className={styles.newListSecondaryBtn}
                  onClick={() => setShowCreateInSelect(true)}
                  disabled={isSaving}
                >
                  Neue Merkliste erstellen
                </button>
              </div>
            </>
          )}

          {/* Create-Formular innerhalb des Sheets */}
          {showCreateInSelect && (
            <>
              <div className={styles.sheetCreateBody}>
                <div className={styles.inputWrap}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Gib deiner Merkliste einen Namen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  />
                </div>
              </div>
              <div className={styles.sheetBottom}>
                <button
                  type="button"
                  className={`${styles.saveBtn} ${name.trim() ? styles.saveBtnActive : ""}`}
                  onClick={handleCreate}
                  disabled={!name.trim() || isSaving}
                >
                  Speichern
                </button>
              </div>
            </>
          )}

          {/* Saving overlay */}
          {isSaving && (
            <div className={styles.sheetSavingOverlay}>
              <span className={styles.loadingDot} />
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <p className={styles.errorMsg}>
              Etwas ist schiefgelaufen. Bitte versuche es nochmals.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Zentrierte Card (Fall 1: noch keine Merkliste / nur erstellen) ───────────
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>

        <div className={styles.cardHeader}>
          <h2 className={styles.title}>Neue Merkliste erstellen</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Schliessen">
            <Image src="/icons/icon-close-medium.svg" alt="" width={24} height={24} />
          </button>
        </div>

        {status === "loading" && (
          <div className={styles.loadingWrap}>
            <span className={styles.loadingDot} />
          </div>
        )}

        {status === "create" && (
          <>
            <div className={styles.inputWrap}>
              <input
                type="text"
                className={styles.input}
                placeholder="Gib deiner Merkliste einen Namen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              />
            </div>
            <button
              type="button"
              className={`${styles.saveBtn} ${name.trim() ? styles.saveBtnActive : ""}`}
              onClick={handleCreate}
              disabled={!name.trim() || isSaving}
            >
              Speichern
            </button>
          </>
        )}

        {isSaving && (
          <div className={styles.loadingWrap}>
            <span className={styles.loadingDot} />
          </div>
        )}

        {status === "error" && (
          <p className={styles.errorMsg}>
            Etwas ist schiefgelaufen. Bitte prüfe die Konsole und versuche es nochmals.
          </p>
        )}
      </div>
    </div>
  );
}
