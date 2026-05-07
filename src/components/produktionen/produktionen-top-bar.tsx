"use client";

import Image from "next/image";
import styles from "@/components/cockpit/cockpit.module.css";

export function ProduktionenTopBar() {
  return (
    <div className={styles.desktopTopBar}>
      <div style={{
        flex: 1, maxWidth: 420,
        height: 52, borderRadius: 47,
        background: "var(--secondary-500)", border: "1px solid var(--neutral-black)",
        display: "flex", alignItems: "center", gap: 10, padding: "0 16px",
      }}>
        <Image src="/icons/icon-search.svg" alt="" width={20} height={20} style={{ flexShrink: 0 }} />
        <span style={{
          fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)",
          fontWeight: "var(--font-weight-400)", color: "var(--neutral-grey-400)",
        }}>
          durchsuchen
        </span>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
        <button style={{
          height: 52, padding: "0 24px", borderRadius: 16,
          background: "transparent", color: "var(--primary-900)",
          border: "1.5px solid var(--primary-900)", cursor: "pointer",
          fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)",
          fontWeight: "var(--font-weight-500)", whiteSpace: "nowrap",
        }}>
          Produktion erstellen
        </button>

        <button style={{
          height: 52, padding: "0 24px", borderRadius: 16,
          background: "var(--primary-900)", color: "var(--neutral-white)",
          border: "none", cursor: "pointer",
          fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)",
          fontWeight: "var(--font-weight-500)", whiteSpace: "nowrap",
        }}>
          Kostüm erfassen
        </button>
      </div>
    </div>
  );
}
