"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
      router.push("/results");
    } else {
      const ids = Array.from(selectedIds).join(",");
      router.push(`/results?theater=${ids}`);
    }
  }

  return (
    <>
      {/* Trigger button — replaces the plain Link */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: 60,
          height: 60,
          flexShrink: 0,
          background: "#FFFFFF",
          border: "1px solid var(--primary-900)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        aria-label="Standort wählen"
      >
        <Image src="/icons/icon-location.svg" alt="" width={24} height={24} />
      </button>

      {/* Sheet */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2000,
              background: "rgba(36,39,39,0.80)",
            }}
          />

          {/* Bottom sheet */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 2001,
              background: "#FFFFFF",
              borderRadius: "20px 20px 0 0",
              boxShadow: "0px -2px 20px rgba(0,0,0,0.2)",
              padding: "28px 16px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
              <Image src="/icons/icon-location.svg" alt="" width={22} height={22} style={{ flexShrink: 0, marginRight: 10 }} />
              <span style={{
                flex: 1,
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-300)",
                fontWeight: "var(--font-weight-500)",
                color: "#000000",
              }}>
                Standorte durchsuchen
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
                aria-label="Schliessen"
              >
                <Image src="/icons/icon-close-medium.svg" alt="Schliessen" width={20} height={20} />
              </button>
            </div>

            {/* Theater list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {theaters.map((theater) => {
                const selected = selectedIds.has(theater.id);
                return (
                  <button
                    key={theater.id}
                    type="button"
                    onClick={() => toggleTheater(theater.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      height: 64,
                      padding: "0 16px",
                      borderRadius: 10,
                      background: selected ? "var(--secondary-500)" : "#FFFFFF",
                      border: selected
                        ? "1px solid var(--secondary-700)"
                        : "1px solid var(--neutral-grey-600)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <Image
                      src="/icons/icon-location.svg"
                      alt=""
                      width={24}
                      height={24}
                      style={{ flexShrink: 0, opacity: 0.7 }}
                    />
                    <span style={{
                      flex: 1,
                      fontFamily: "var(--font-family-base)",
                      fontSize: "var(--font-size-350)",
                      fontWeight: "var(--font-weight-700)",
                      color: selected ? "var(--secondary-800)" : "var(--neutral-grey-600)",
                    }}>
                      {theater.name}
                    </span>

                    {/* Checkbox */}
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      border: "2px solid var(--secondary-800)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: selected ? "var(--secondary-800)" : "#FFFFFF",
                      flexShrink: 0,
                    }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
              <button
                type="button"
                role="switch"
                aria-checked={allLocations}
                onClick={() => setAllLocations((v) => !v)}
                style={{
                  width: 50,
                  height: 28,
                  borderRadius: 72,
                  background: allLocations ? "var(--secondary-800)" : "var(--secondary-500)",
                  boxShadow: "inset 0px 1px 4px rgba(0,0,0,0.3)",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  flexShrink: 0,
                  transition: "background 150ms ease",
                }}
              >
                <span style={{
                  position: "absolute",
                  top: 3,
                  left: allLocations ? "calc(100% - 25px)" : 3,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  boxShadow: "0px 1px 2.5px rgba(0,0,0,0.2)",
                  transition: "left 150ms ease",
                }} />
              </button>
              <span style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-350)",
                fontWeight: "var(--font-weight-700)",
                color: "var(--neutral-grey-600)",
              }}>
                Alle Standorte durchsuchen
              </span>
            </div>

            {/* Save button */}
            <button
              type="button"
              onClick={handleSave}
              style={{
                width: "100%",
                height: 62,
                borderRadius: "var(--radius-md)",
                background: "var(--primary-900)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-350)",
                fontWeight: "var(--font-weight-500)",
                color: "#FFFFFF",
              }}
            >
              speichern &amp; schliessen
            </button>
          </div>
        </>
      )}
    </>
  );
}
