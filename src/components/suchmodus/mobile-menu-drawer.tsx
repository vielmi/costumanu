"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { GenderTerm } from "./suchmodus-cockpit";
import styles from "./mobile-menu-drawer.module.css";

const NETZWERK_ITEMS = [
  { label: "Nachrichten",    href: "/messages", icon: "icon-chat"         },
  { label: "Kostümanfragen", href: "/rental",   icon: "icon-shopping-bag" },
  { label: "Netzwerk",       href: "/netzwerk", icon: "icon-production-menu" },
  { label: "Support",        href: "/support",  icon: "icon-contact-menu" },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MobileMenuDrawer({ genderTerms = [] }: { genderTerms?: GenderTerm[] }) {
  const [open, setOpen] = useState(false);

  function close() { setOpen(false); }

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

          {/* Scrollable content */}
          <div className={styles.content}>

            {/* Section: Kostüme — aus DB */}
            <p className={styles.sectionLabel}>Kostüme</p>
            <nav>
              {genderTerms.map((term) => (
                <Link key={term.id} href={`/results?gender=${term.id}`} onClick={close} className={styles.navItem}>
                  <span className={styles.navLabel}>{term.label_de}</span>
                  <ArrowRight />
                </Link>
              ))}
            </nav>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Section: Netzwerk & Support */}
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

          {/* Profile footer */}
          <Link href="/profile" onClick={close} className={styles.profileFooter}>
            <div className={styles.avatarCircle}>
              <Image src="/icons/icon-avatar.svg" alt="" width={32} height={32} style={{ filter: "invert(1)" }} />
            </div>
            <span className={styles.profileLabel}>Mein Profil</span>
            <ArrowRight />
          </Link>
        </div>
      )}
    </>
  );
}
