"use client";

import { useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

export interface ContextMenuItem {
  label: string;
  action: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  disabled?: boolean;
  /** "left" öffnet das Dropdown nach rechts-unten, "right" nach links-unten */
  align?: "left" | "right";
}

/**
 * Wiederverwendbares 3-Punkt-Kontextmenü.
 * Schliesst automatisch bei Klick ausserhalb.
 */
export function ContextMenu({
  items,
  isOpen,
  onToggle,
  onClose,
  disabled = false,
  align = "right",
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        style={{
          background: "transparent",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          padding: 6,
          borderRadius: "var(--radius-xs)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--neutral-grey-500)",
          opacity: disabled ? 0.4 : 1,
        }}
        aria-label="Mehr Optionen"
        aria-expanded={isOpen}
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            background: "#FFFFFF",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-300)",
            zIndex: 200,
            overflow: "hidden",
            minWidth: 160,
          }}
        >
          {items.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-300)",
                fontWeight: "var(--font-weight-400)",
                color: item.danger ? "var(--primary-900)" : "var(--neutral-grey-600)",
                background: "transparent",
                border: "none",
                borderBottom: i < items.length - 1 ? "1px solid var(--secondary-500)" : "none",
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
