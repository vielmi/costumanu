"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { RecentCostume } from "@/components/cockpit/cockpit-shell";

interface CockpitContentProps {
  recentCostumes: RecentCostume[];
  theaterId: string | null;
}

const IMAGE_CARDS = [
  {
    title: "Kostüm Übersicht",
    href: "/fundus",
    overlayOpacity: 0.3,
    bg: "var(--secondary-800)",
    image: "/images/cockpit-kostueme.jpg",
  },
  {
    title: "Aktuelle- & vergangene Aufführungen",
    href: "/auffuehrungen",
    overlayOpacity: 0.5,
    bg: "var(--secondary-900)",
    image: "/images/cockpit-auffuehrungen.jpg",
  },
];

function getStatusFromItems(items: RecentCostume["costume_items"]): "available" | "unavailable" | "in-progress" {
  if (!items || items.length === 0) return "available";
  const statuses = items.map((i) => i.current_status);
  if (statuses.every((s) => s === "available")) return "available";
  if (statuses.some((s) => s === "rented")) return "unavailable";
  return "in-progress";
}

function StatusDot({ status }: { status: "available" | "unavailable" | "in-progress" }) {
  const color =
    status === "available"
      ? "var(--accent-01)"
      : status === "unavailable"
      ? "var(--color-error)"
      : "var(--color-warning)";
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        display: "inline-block",
      }}
    />
  );
}

function CostumeRow({ costume, isActive }: { costume: RecentCostume; isActive: boolean }) {
  const supabase = createClient();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const mediaPaths = (costume.costume_media ?? []).map((m) => m.storage_path);
      if (mediaPaths.length > 0) {
        await supabase.storage.from("costume-images").remove(mediaPaths);
      }
      await supabase.from("costume_taxonomy").delete().eq("costume_id", costume.id);
      await supabase.from("costume_provenance").delete().eq("costume_id", costume.id);
      await supabase.from("costume_items").delete().eq("costume_id", costume.id);
      await supabase.from("costume_media").delete().eq("costume_id", costume.id);
      await supabase.from("costumes").delete().eq("id", costume.id);
      router.refresh();
    } catch {
      setDeleting(false);
      setShowDeleteSheet(false);
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    setMenuOpen(false);
    try {
      // Fetch full costume record
      const { data: orig } = await supabase
        .from("costumes")
        .select("theater_id, name, description, gender_term_id, clothing_type_id, is_ensemble, ensemble_parent_id, is_public, direct_visible")
        .eq("id", costume.id)
        .single();

      if (!orig) return;

      // Insert new costume with "_Kopie" suffix
      const { data: newC } = await supabase
        .from("costumes")
        .insert({ ...orig, name: orig.name + "_Kopie" })
        .select("id")
        .single();

      if (!newC) return;
      const newId = newC.id;

      // Copy related records in parallel
      const [items, taxonomy, provenance, media] = await Promise.all([
        supabase.from("costume_items").select("size_label, barcode_id, rfid_id, current_status, storage_location_path, condition, notes").eq("costume_id", costume.id),
        supabase.from("costume_taxonomy").select("term_id").eq("costume_id", costume.id),
        supabase.from("costume_provenance").select("production_title, year, role_name, actor_name, sort_order").eq("costume_id", costume.id),
        supabase.from("costume_media").select("storage_path, sort_order, mime_type").eq("costume_id", costume.id),
      ]);

      await Promise.all([
        items.data?.length ? supabase.from("costume_items").insert(items.data.map((i) => ({ ...i, costume_id: newId }))) : Promise.resolve(),
        taxonomy.data?.length ? supabase.from("costume_taxonomy").insert(taxonomy.data.map((t) => ({ costume_id: newId, term_id: t.term_id }))) : Promise.resolve(),
        provenance.data?.length ? supabase.from("costume_provenance").insert(provenance.data.map((p) => ({ ...p, costume_id: newId }))) : Promise.resolve(),
        media.data?.length ? supabase.from("costume_media").insert(media.data.map((m) => ({ ...m, costume_id: newId }))) : Promise.resolve(),
      ]);

      router.refresh();
    } finally {
      setDuplicating(false);
    }
  }

  const firstMedia = costume.costume_media?.[0];
  const firstProvenance = costume.costume_provenance?.[0];
  const status = getStatusFromItems(costume.costume_items);

  const imageUrl = firstMedia
    ? supabase.storage.from("costume-images").getPublicUrl(firstMedia.storage_path).data.publicUrl
    : null;

  const productionLabel = firstProvenance
    ? firstProvenance.year
      ? `${firstProvenance.production_title}, ${firstProvenance.year}`
      : firstProvenance.production_title
    : "—";

  return (
    <>
      {/* Row wrapper: 3-dot left | Link content right */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          height: 70,
          borderRadius: "var(--radius-xs)",
          background: isActive ? "var(--secondary-500)" : "var(--neutral-grey-100)",
          flexShrink: 0,
          position: "relative",
          overflow: "visible",
        }}
      >
        {/* Active indicator */}
        {isActive && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 5,
              height: 70,
              background: "var(--accent-01)",
              borderRadius: "4px 0 0 4px",
              zIndex: 1,
            }}
          />
        )}

        {/* ── 3-dot menu — LEFT, outside <Link> ── */}
        <div
          ref={menuRef}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 4px 0 12px",
            flexShrink: 0,
            position: "relative",
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            disabled={duplicating}
            style={{
              background: "transparent",
              border: "none",
              cursor: duplicating ? "wait" : "pointer",
              padding: 4,
              borderRadius: "var(--radius-xs)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--neutral-grey-500)",
              opacity: duplicating ? 0.4 : 1,
            }}
            aria-label="Mehr Optionen"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% - 8px)",
                left: 8,
                background: "#FFFFFF",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-300)",
                zIndex: 200,
                overflow: "hidden",
                minWidth: 160,
              }}
            >
              {[
                {
                  label: "Bearbeiten",
                  action: () => { setMenuOpen(false); router.push(`/kostueme/neu?edit=${costume.id}`); },
                  danger: false,
                },
                {
                  label: "Duplizieren",
                  action: handleDuplicate,
                  danger: false,
                },
                {
                  label: "Löschen",
                  action: () => { setMenuOpen(false); setShowDeleteSheet(true); },
                  danger: true,
                },
              ].map(({ label, action, danger }, i, arr) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    fontFamily: "var(--font-family-base)",
                    fontSize: "var(--font-size-300)",
                    fontWeight: "var(--font-weight-400)",
                    color: danger ? "var(--primary-900)" : "var(--neutral-grey-600)",
                    background: "transparent",
                    border: "none",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--secondary-500)" : "none",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Row content as Link ── */}
        <Link
          href={`/costume/${costume.id}`}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 16px 0 4px",
            textDecoration: "none",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "100px",
              overflow: "hidden",
              flexShrink: 0,
              background: "var(--neutral-grey-300)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={costume.name}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            ) : (
              <Image
                src="/icons/icon-shirt.svg"
                alt=""
                width={24}
                height={24}
                style={{ opacity: 0.4 }}
              />
            )}
          </div>

          {/* ID + Name */}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: "var(--font-size-50)",
                color: "var(--neutral-grey-500)",
                fontFamily: "var(--font-family-base)",
              }}
            >
              ID-{costume.id.slice(0, 9).toUpperCase()}
            </span>
            <span
              style={{
                fontSize: "var(--font-size-200)",
                fontWeight: "var(--font-weight-500)",
                color: "#000000",
                fontFamily: "var(--font-family-base)",
                letterSpacing: "0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {costume.name}
            </span>
          </div>

          {/* Production */}
          <span
            style={{
              fontSize: "var(--font-size-200)",
              color: "var(--neutral-grey-600)",
              fontFamily: "var(--font-family-base)",
              flexShrink: 0,
              minWidth: 120,
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {productionLabel}
          </span>

          {/* Gender / type badge */}
          <div
            style={{
              border: "1px solid var(--neutral-grey-300)",
              borderRadius: "var(--radius-md)",
              height: 40,
              padding: "0 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <Image
              src={`/icons/icon-${
                costume.gender_term?.label_de === "Herren"
                  ? "male"
                  : costume.gender_term?.label_de === "Damen"
                  ? "female"
                  : "unisex"
              }.svg`}
              alt={costume.gender_term?.label_de ?? ""}
              width={16}
              height={16}
            />
            <div style={{ width: "0.8px", height: 20, background: "var(--neutral-grey-300)" }} />
            <Image src="/icons/icon-shirt.svg" alt="" width={16} height={16} />
          </div>

          {/* Status dot */}
          <StatusDot status={status} />
        </Link>
      </div>

      {/* ── Delete confirmation sheet ── */}
      {showDeleteSheet && (
        <>
          <div
            onClick={() => setShowDeleteSheet(false)}
            style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.4)" }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 2001,
              background: "var(--neutral-white)",
              borderRadius: "24px 24px 0 0",
              padding: "28px 20px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "var(--neutral-grey-200)",
                alignSelf: "center",
                marginBottom: 8,
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-325)",
                fontWeight: 600,
                color: "var(--neutral-grey-600)",
                marginBottom: 4,
              }}
            >
              Kostüm löschen?
            </p>
            <p
              style={{
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-200)",
                color: "var(--neutral-grey-400)",
                marginBottom: 8,
              }}
            >
              <strong style={{ color: "var(--neutral-grey-600)" }}>{costume.name}</strong> wird unwiderruflich gelöscht und kann nicht wiederhergestellt werden.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              style={{
                height: "var(--button-height-md)",
                borderRadius: "var(--radius-md)",
                background: "none",
                border: "1.5px solid var(--primary-900)",
                color: "var(--primary-900)",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-250)",
                fontWeight: 600,
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? "Wird gelöscht…" : "Endgültig löschen"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteSheet(false)}
              disabled={deleting}
              style={{
                height: "var(--button-height-md)",
                borderRadius: "var(--radius-md)",
                background: "var(--secondary-900)",
                border: "none",
                color: "var(--neutral-white)",
                fontFamily: "var(--font-family-base)",
                fontSize: "var(--font-size-250)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Abbrechen
            </button>
          </div>
        </>
      )}
    </>
  );
}

export function CockpitContent({ recentCostumes }: CockpitContentProps) {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ─── Image Cards ─── */}
      <div style={{ display: "flex", gap: 12 }}>
        {IMAGE_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              flex: 1,
              height: 180,
              borderRadius: "var(--radius-md)",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              background: card.bg,
              textDecoration: "none",
              display: "block",
              minWidth: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `rgba(0,0,0,${card.overlayOpacity})`,
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: 16,
                left: 20,
                right: 44,
                fontSize: "var(--font-size-400)",
                fontWeight: "var(--font-weight-500)",
                color: "#FFFFFF",
                fontFamily: "var(--font-family-base)",
                lineHeight: "var(--line-height-150)",
              }}
            >
              {card.title}
            </span>
            <div
              style={{
                position: "absolute",
                bottom: 20,
                right: 16,
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src="/icons/icon-arrow-right-2.svg"
                alt=""
                width={26}
                height={26}
                style={{ filter: "invert(1)" }}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* ─── Zuletzt bearbeitete Kostüme ─── */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-350)",
            fontWeight: "var(--font-weight-500)",
            color: "var(--neutral-grey-700)",
            marginBottom: 16,
          }}
        >
          Zuletzt bearbeitete{" "}
          <span style={{ fontWeight: "var(--font-weight-700)", textDecoration: "underline" }}>
            Kostüme
          </span>
        </h2>

        {/* List + CTA side by side */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

          {/* Costume list */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {recentCostumes.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-300)",
                  color: "var(--neutral-grey-500)",
                }}
              >
                Noch keine Kostüme erfasst.{" "}
                <Link href="/kostueme/neu" style={{ color: "var(--primary-900)" }}>
                  Jetzt erstes Kostüm erfassen
                </Link>
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentCostumes.map((costume, index) => (
                  <CostumeRow key={costume.id} costume={costume} isActive={index === 0} />
                ))}
              </div>
            )}
          </div>

          {/* CTA Card "Suchmodus öffnen" */}
          <Link
            href="/suchmodus"
            style={{
              width: 187,
              height: 245,
              borderRadius: "var(--radius-md)",
              position: "relative",
              overflow: "hidden",
              background: "var(--tertiary-900)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cockpit-search.jpg"
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                padding: "0 16px",
              }}
            >
              <span
                style={{
                  fontSize: "var(--font-size-400)",
                  fontWeight: "var(--font-weight-500)",
                  color: "#FFFFFF",
                  fontFamily: "var(--font-family-base)",
                  textAlign: "center",
                  lineHeight: "var(--line-height-150)",
                }}
              >
                Suchmodus öffnen
              </span>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  border: "1px solid #FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  src="/icons/icon-plus-m.svg"
                  alt=""
                  width={24}
                  height={24}
                  style={{ filter: "invert(1)" }}
                />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Legacy export for any existing imports
export { CockpitContent as CockpitClient };
