"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";
import type { CostumeMedia } from "@/lib/types/costume";

const supabase = createClient();

type ImageCarouselProps = {
  media: CostumeMedia[];
  name: string;
  height?: string;
  objectFit?: "cover" | "contain";
  className?: string;
};

export function ImageCarousel({ media, name, height = "260px", objectFit = "cover", className = "mx-4" }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const sorted = useMemo(
    () => [...media].sort((a, b) => a.sort_order - b.sort_order),
    [media]
  );

  const publicUrls = useMemo(
    () => sorted.map((m) => supabase.storage.from("costume-images").getPublicUrl(m.storage_path).data.publicUrl),
    [sorted]
  );

  const prev = () => setCurrentIndex((i) => (i === 0 ? sorted.length - 1 : i - 1));
  const next = () => setCurrentIndex((i) => (i === sorted.length - 1 ? 0 : i + 1));

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  };

  if (media.length === 0) {
    return (
      <div className={className} style={containerStyle}>
        <EmptyState label={t("costume.noPhoto")} />
      </div>
    );
  }

  const currentUrl = publicUrls[currentIndex];
  const currentFailed = !currentUrl || failedUrls.has(currentUrl);
  const multi = sorted.length > 1;

  return (
    <div
      className={className}
      style={{ position: "relative", height, flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={containerStyle}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || !multi) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); }
          touchStartX.current = null;
        }}
      >
        {currentFailed ? (
          <EmptyState label={t("costume.noPhoto")} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={currentUrl}
            src={currentUrl}
            alt=""
            aria-label={`${name} – ${t("costume.image")} ${currentIndex + 1}`}
            onError={() => setFailedUrls((prev) => new Set(prev).add(currentUrl))}
            style={{ width: "100%", height: "100%", objectFit, display: "block" }}
          />
        )}

        {/* Prev / next arrow buttons */}
        {multi && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label={t("costume.previousImage")}
              style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.85)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                opacity: hovered ? 1 : 0,
                transition: "opacity 150ms ease",
                pointerEvents: hovered ? "auto" : "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="#242727" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={t("costume.nextImage")}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.85)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                opacity: hovered ? 1 : 0,
                transition: "opacity 150ms ease",
                pointerEvents: hovered ? "auto" : "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="#242727" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators — overlaid at bottom */}
        {multi && (
          <div style={{
            position: "absolute", bottom: 12, left: 0, right: 0,
            display: "flex", justifyContent: "center", gap: 6,
            pointerEvents: "none",
          }}>
            {sorted.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setCurrentIndex(i)}
                aria-label={t("costume.showImage", { n: i + 1 })}
                style={{
                  width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0,
                  background: i === currentIndex ? "var(--neutral-white)" : "rgba(255,255,255,0.5)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  transition: "background 150ms ease",
                  pointerEvents: "auto",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label?: string }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--neutral-grey-400)",
      fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-150)",
    }}>
      {label ?? ""}
    </div>
  );
}
