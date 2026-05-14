"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { t } from "@/lib/i18n";
import type { Costume } from "@/lib/types/costume";

type SimilarCostumesProps = {
  costumes: Costume[];
};

export function SimilarCostumes({ costumes }: SimilarCostumesProps) {
  return (
    <section style={{ paddingBottom: 32 }}>
      <h2
        style={{
          fontFamily: "var(--font-family-base)",
          fontSize: "var(--font-size-350)",
          fontWeight: 700,
          color: "var(--neutral-black)",
          margin: "0 0 16px",
          padding: "0 16px",
        }}
      >
        {t("costume.similarCostumes")}
      </h2>
      <ScrollArea className="w-full">
        <div
          style={{
            display: "flex",
            gap: 12,
            paddingBottom: 12,
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          {costumes.map((costume) => (
            <SimilarCostumeCard key={costume.id} costume={costume} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}

function SimilarCostumeCard({ costume }: { costume: Costume }) {
  const supabase = createClient();
  const firstMedia = costume.costume_media?.[0];
  const firstProvenance = costume.costume_provenance?.[0];
  const clothingType = (costume.clothing_type as { label_de?: string } | null)?.label_de ?? null;
  const theaterName = (costume.theater as { name?: string } | null)?.name ?? null;

  const epoch =
    (
      costume.costume_taxonomy as
        | { term_id: string; taxonomy_term: { vocabulary: string; label_de: string } | null }[]
        | undefined
    )?.find((ct) => ct.taxonomy_term?.vocabulary === "epoche")?.taxonomy_term?.label_de ?? null;

  const imageUrl = firstMedia
    ? supabase.storage.from("costume-images").getPublicUrl(firstMedia.storage_path).data.publicUrl
    : null;

  return (
    <Link
      href={`/costume/${costume.id}`}
      style={{ flexShrink: 0, width: 148, textDecoration: "none", color: "inherit" }}
    >
      {/* Image */}
      <div
        style={{
          width: 148,
          height: 186,
          borderRadius: 8,
          overflow: "hidden",
          background: "var(--neutral-grey-200)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
          flexShrink: 0,
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={costume.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        ) : (
          <Image
            src="/icons/icon-shirt.svg"
            alt=""
            width={36}
            height={36}
            style={{ opacity: 0.25 }}
          />
        )}
      </div>

      {/* Category label */}
      {clothingType && (
        <p
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-50)",
            color: "var(--neutral-grey-500)",
            margin: "0 0 2px",
          }}
        >
          {clothingType}
        </p>
      )}

      {/* Name */}
      <p
        style={{
          fontFamily: "var(--font-family-base)",
          fontSize: "var(--font-size-150)",
          fontWeight: 700,
          color: "var(--neutral-black)",
          margin: "0 0 2px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
          overflow: "hidden",
          lineHeight: 1.3,
        }}
      >
        {costume.name}
      </p>

      {/* Provenance */}
      {firstProvenance && (
        <p
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-50)",
            color: "var(--neutral-grey-500)",
            margin: "0 0 2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {[firstProvenance.production_title, firstProvenance.year].filter(Boolean).join(", ")}
        </p>
      )}

      {/* Epoch */}
      {epoch && (
        <p
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-50)",
            color: "var(--neutral-grey-500)",
            margin: "0 0 4px",
          }}
        >
          {epoch}
        </p>
      )}

      {/* Theater */}
      {theaterName && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "var(--accent-01)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Image
              src="/icons/icon-check.svg"
              alt=""
              width={8}
              height={8}
              style={{ filter: "invert(1)" }}
            />
          </span>
          <span
            style={{
              fontFamily: "var(--font-family-base)",
              fontSize: "var(--font-size-50)",
              color: "var(--neutral-grey-600)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {theaterName}
          </span>
        </div>
      )}
    </Link>
  );
}
