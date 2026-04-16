"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";
import type { CostumeMedia } from "@/lib/types/costume";

type ImageCarouselProps = {
  media: CostumeMedia[];
  name: string;
  height?: string;
  objectFit?: "cover" | "contain";
  className?: string;
};

export function ImageCarousel({ media, name, height = "260px", objectFit = "cover", className = "mx-4" }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const supabase = createClient();

  const publicUrls = media.map(
    (m) => supabase.storage.from("costume-images").getPublicUrl(m.storage_path).data.publicUrl
  );

  if (media.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground`} style={{ height }}>
        {t("costume.noPhoto")}
      </div>
    );
  }

  const currentUrl = publicUrls[currentIndex];

  return (
    <div className={`relative ${className}`}>
      {/* Main image */}
      <div className="overflow-hidden rounded-xl bg-muted" style={{ height }}>
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt={`${name} – ${t("costume.image")} ${currentIndex + 1}`}
            className="h-full w-full"
            style={{ objectFit }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10" />
        )}
      </div>

      {/* Dot indicators */}
      {media.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {media.map((_, i) => (
            <button
              key={media[i].id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === currentIndex
                  ? "bg-foreground"
                  : "bg-muted-foreground/30"
              }`}
              aria-label={t("costume.showImage", { n: i + 1 })}
            />
          ))}
        </div>
      )}

      {/* Swipe area (touch targets for prev/next) */}
      {media.length > 1 && (
        <>
          <button
            type="button"
            className="absolute inset-y-0 left-0 w-1/3"
            onClick={() =>
              setCurrentIndex((i) => (i === 0 ? media.length - 1 : i - 1))
            }
            aria-label={t("costume.previousImage")}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 w-1/3"
            onClick={() =>
              setCurrentIndex((i) => (i === media.length - 1 ? 0 : i + 1))
            }
            aria-label={t("costume.nextImage")}
          />
        </>
      )}
    </div>
  );
}
