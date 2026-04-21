"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./standort-sheet.module.css";
import type { NetworkTheater } from "./suchmodus-cockpit";

interface StandortSheetProps {
  theaters: NetworkTheater[];
}

export function StandortSheet({ theaters }: StandortSheetProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allLocations, setAllLocations] = useState(false);
  const router = useRouter();

  function toggleTheater(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function handleSave() {
    setOpen(false);
    if (allLocations || selectedIds.size === 0) {
      router.push("/suchmodus/results");
    } else {
      const ids = Array.from(selectedIds).join(",");
      router.push(`/suchmodus/results?theater=${ids}`);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.triggerBtn}
        aria-label="Standort wählen"
      >
        <Image src="/icons/icon-location.svg" alt="" width={24} height={24} />
      </button>

      {/* Sheet — via Portal, um transform-Kontext des Eltern-Containers zu verlassen */}
      {open && createPortal(
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} className={styles.backdrop} />

          {/* Bottom sheet */}
          <div className={styles.sheet}>

            {/* Header */}
            <div className={styles.sheetHeader}>
              <Image src="/icons/icon-location.svg" alt="" width={22} height={22} style={{ flexShrink: 0 }} />
              <span className={styles.sheetTitle}>Standorte durchsuchen</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={styles.closeBtn}
                aria-label="Schliessen"
              >
                <Image src="/icons/icon-close-medium.svg" alt="Schliessen" width={20} height={20} />
              </button>
            </div>

            {/* Theater list */}
            <div className={styles.theaterList}>
              {theaters.map((theater) => {
                const selected = selectedIds.has(theater.id);
                return (
                  <button
                    key={theater.id}
                    type="button"
                    onClick={() => toggleTheater(theater.id)}
                    className={`${styles.theaterBtn} ${selected ? styles.selected : ""}`}
                  >
                    <Image
                      src="/icons/icon-location.svg"
                      alt=""
                      width={24}
                      height={24}
                      style={{ flexShrink: 0, opacity: 0.7 }}
                    />
                    <span className={styles.theaterName}>{theater.name}</span>

                    {/* Checkbox */}
                    <span className={`${styles.checkbox} ${selected ? styles.checked : ""}`}>
                      {selected && (
                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                          <path d="M1 4L4.5 7.5L11 1" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Toggle: Alle Standorte */}
            <div className={styles.toggleRow}>
              <button
                type="button"
                role="switch"
                aria-checked={allLocations}
                onClick={() => setAllLocations((v) => !v)}
                className={`${styles.toggleSwitch} ${allLocations ? styles.on : ""}`}
              >
                <span className={`${styles.toggleThumb} ${allLocations ? styles.on : ""}`} />
              </button>
              <span className={styles.toggleLabel}>Alle Standorte durchsuchen</span>
            </div>

            {/* Save button */}
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
              style={{ width: "100%" }}
            >
              speichern &amp; schliessen
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
