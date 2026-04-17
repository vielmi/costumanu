"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { GenderTerm } from "./suchmodus-cockpit";
import styles from "./mobile-menu-drawer.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClothingType = { id: string; label_de: string };
type Level = "main" | "gender";

// ─── Data ─────────────────────────────────────────────────────────────────────

const NETZWERK_ITEMS = [
  { label: "Nachrichten",    href: "/messages", icon: "icon-chat"            },
  { label: "Kostümanfragen", href: "/rental",   icon: "icon-shopping-bag"    },
  { label: "Netzwerk",       href: "/netzwerk", icon: "icon-production-menu" },
  { label: "Support",        href: "/support",  icon: "icon-contact-menu"    },
] as const;

// ─── Icons ────────────────────────────────────────────────────────────────────

function BurgerIcon() {
  return (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
      <rect width="24" height="2" rx="1" fill="currentColor" />
      <rect y="8" width="24" height="2" rx="1" fill="currentColor" />
      <rect y="16" width="24" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M7.5 5L12.5 10L7.5 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M12.5 5L7.5 10L12.5 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MobileMenuDrawer({ genderTerms = [] }: { genderTerms?: GenderTerm[] }) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<Level>("main");
  const [activeGender, setActiveGender] = useState<GenderTerm | null>(null);
  const [clothingTypes, setClothingTypes] = useState<ClothingType[]>([]);
  const [loading, setLoading] = useState(false);

  function close() {
    setOpen(false);
    setLevel("main");
    setActiveGender(null);
    setClothingTypes([]);
  }

  function goBack() {
    setLevel("main");
    setActiveGender(null);
    setClothingTypes([]);
  }

  async function openGender(term: GenderTerm) {
    setActiveGender(term);
    setLevel("gender");
    setLoading(true);
    setClothingTypes([]);

    try {
      const supabase = createClient();

      // Fetch distinct clothing_type_ids that appear in costumes with this gender
      const { data: costumes } = await supabase
        .from("costumes")
        .select("clothing_type_id")
        .eq("gender_term_id", term.id)
        .not("clothing_type_id", "is", null);

      const ids = [...new Set((costumes ?? []).map((c) => c.clothing_type_id as string))];

      if (ids.length === 0) {
        setClothingTypes([]);
        return;
      }

      // Fetch the taxonomy_terms for those ids, ordered by sort_order
      const { data: terms } = await supabase
        .from("taxonomy_terms")
        .select("id, label_de")
        .in("id", ids)
        .order("sort_order");

      setClothingTypes((terms ?? []) as ClothingType[]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Burger trigger — only visible on mobile via CSS */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.burgerButton}
        aria-label="Menü öffnen"
      >
        <BurgerIcon />
      </button>

      {/* Drawer */}
      {open && (
        <div className={styles.overlay}>
          {/* Close button */}
          <button
            type="button"
            onClick={close}
            className={styles.closeButton}
            aria-label="Menü schliessen"
          >
            <Image src="/icons/icon-close-medium.svg" alt="" width={20} height={20} style={{ filter: "invert(1)" }} />
          </button>

          {/* ── Level 1: Hauptmenü ── */}
          {level === "main" && (
            <>
              <div className={styles.content}>
                <p className={styles.sectionLabel}>Kostüme</p>
                <nav>
                  {genderTerms.map((term) => (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => openGender(term)}
                      className={styles.navItemButton}
                    >
                      <span className={styles.navLabel}>{term.label_de}</span>
                      <ArrowRight />
                    </button>
                  ))}
                </nav>

                <div className={styles.divider} />

                <p className={styles.sectionLabel}>Netzwerk &amp; Support</p>
                <nav>
                  {NETZWERK_ITEMS.map((item) => (
                    <Link key={item.href} href={item.href} onClick={close} className={styles.navItem}>
                      <Image
                        src={`/icons/${item.icon}.svg`}
                        alt=""
                        width={26}
                        height={26}
                        style={{ filter: "invert(1)", flexShrink: 0 }}
                      />
                      <span className={styles.navLabel}>{item.label}</span>
                      <ArrowRight />
                    </Link>
                  ))}
                </nav>
              </div>

              <Link href="/profile" onClick={close} className={styles.profileFooter}>
                <div className={styles.avatarCircle}>
                  <Image src="/icons/icon-avatar.svg" alt="" width={32} height={32} style={{ filter: "invert(1)" }} />
                </div>
                <span className={styles.profileLabel}>Mein Profil</span>
                <ArrowRight />
              </Link>
            </>
          )}

          {/* ── Level 2: Bekleidungsart ── */}
          {level === "gender" && (
            <div className={styles.content}>
              {/* ← Übersicht */}
              <button type="button" onClick={goBack} className={styles.backButton}>
                <ArrowLeft />
                <span className={styles.backLabel}>Übersicht</span>
              </button>

              {/* "[Gender] Bekleidungsart" */}
              <p className={styles.level2Title}>{activeGender?.label_de} Bekleidungsart</p>

              {loading && <p className={styles.loadingLabel}>Laden…</p>}

              {!loading && clothingTypes.length === 0 && (
                <p className={styles.emptyLabel}>Keine Kostüme in dieser Kategorie</p>
              )}

              {!loading && clothingTypes.length > 0 && (
                <nav>
                  <Link
                    href={`/results?gender=${activeGender?.id}`}
                    onClick={close}
                    className={styles.navItem}
                  >
                    <span className={styles.navLabel}>Alles entdecken</span>
                    <ArrowRight />
                  </Link>
                  {clothingTypes.map((ct) => (
                    <Link
                      key={ct.id}
                      href={`/results?gender=${activeGender?.id}&clothing_type=${ct.id}`}
                      onClick={close}
                      className={styles.navItem}
                    >
                      <span className={styles.navLabel}>{ct.label_de}</span>
                      <ArrowRight />
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
