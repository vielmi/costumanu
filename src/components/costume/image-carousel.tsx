"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";
import type { CostumeMedia } from "@/lib/types/costume";

type ImageCarouselProps = {
  media: CostumeMedia[];
  name: string;
};

export function ImageCarousel({ media, name }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const supabase = createClient();

  const { data: signedUrls } = useQuery({
    queryKey: [
      "costume-carousel",
      media.map((m) => m.storage_path).join(","),
    ],
    queryFn: async () => {
      const urls: (string | null)[] = [];
      for (const m of media) {
        const { data, error } = await supabase.storage
          .from("costume-images")
          .createSignedUrl(m.storage_path, 3600);
        urls.push(error ? null : data.signedUrl);
      }
      return urls;
    },
    enabled: media.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  if (media.length === 0) {
    return (
      <div className="mx-4 flex aspect-[3/4] items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        {t("costume.noPhoto")}
      </div>
    );
  }

  const currentUrl = signedUrls?.[currentIndex];

  return (
    <div className="relative mx-4">
      {/* Main image */}
      <div className="aspect-[3/4] overflow-hidden rounded-xl bg-muted">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt={`${name} – ${t("costume.image")} ${currentIndex + 1}`}
            className="h-full w-full object-cover"
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
