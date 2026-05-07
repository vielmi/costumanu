"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { deleteCostume, duplicateCostume } from "@/lib/services/costume-service";
import { getPublicUrl } from "@/lib/services/storage-service";
import { getGenderIcon } from "@/lib/constants/icons";
import { ContextMenu } from "@/components/ui/context-menu";
import { DeleteConfirmationSheet } from "@/components/ui/delete-confirmation-sheet";
import type { Costume } from "@/lib/types/costume";
import styles from "./fundus.module.css";

const GENDER_OPTIONS = ["Damen", "Herren", "Unisex", "Kinder", "Tier", "Fantasy"] as const;

interface FundusClientProps {
  initialCostumes: Costume[];
  theaterId: string;
  theaterIds?: string[];
  showAddButton?: boolean;
  clothingOptions?: string[];
}

const STATUS_OPTIONS = [
  { value: "available",  label: "Verfügbar",    color: "var(--accent-01)" },
  { value: "rented",     label: "Ausgeliehen",  color: "var(--color-error)" },
  { value: "cleaning",   label: "Reinigung",    color: "var(--color-warning)" },
  { value: "in_repair",  label: "In Reparatur", color: "var(--color-error)" },
  { value: "reserved",   label: "Reserviert",   color: "var(--color-error)" },
  { value: "stage",      label: "Bühne",        color: "var(--color-error)" },
  { value: "rehearsal",  label: "Probebühne",   color: "var(--color-error)" },
  { value: "sorted_out", label: "Aussortiert",  color: "var(--color-error)" },
  { value: "sold",       label: "Verkauft",     color: "var(--color-error)" },
];

export function FundusClient({
  initialCostumes,
  theaterId,
  theaterIds,
  clothingOptions = [],
}: FundusClientProps) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const queryIds = theaterIds ?? [theaterId];

  const { data: costumes } = useQuery({
    queryKey: ["costumes", queryIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("costumes")
        .select(`
          id, name, description, gender_term_id, clothing_type_id, created_at, theater_id,
          gender_term:taxonomy_terms!gender_term_id(id, vocabulary, label_de, parent_id, sort_order),
          clothing_type:taxonomy_terms!clothing_type_id(id, vocabulary, label_de, parent_id, sort_order),
          costume_media(id, costume_id, storage_path, sort_order, created_at),
          costume_provenance(id, costume_id, production_title, year, role_name),
          costume_items(id, costume_id, theater_id, barcode_id, size_label, condition_grade, current_status, storage_location_path),
          costume_taxonomy(term_id, taxonomy_term:taxonomy_terms(id, vocabulary, label_de)),
          theater:theaters!theater_id(id, name, slug)
        `)
        .in("theater_id", queryIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Costume[];
    },
    initialData: initialCostumes,
  });

  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"name_asc" | "name_desc" | "newest" | "oldest">("name_asc");
  const [filters, setFilters] = useState({
    status: "",
    gender: searchParams.get("gender") ?? "",
    clothingType: searchParams.get("clothingType") ?? "",
    epoch: "",
    theater: "",
    standort: "",
  });
  const [editMode, setEditMode] = useState(false);

  const filterOptions = useMemo(() => {
    const epochs = new Set<string>();
    const theaters = new Set<string>();
    const standorte = new Set<string>();
    costumes.forEach((c) => {
      c.costume_taxonomy?.forEach((t) => {
        if (t.taxonomy_term?.vocabulary === "epoch" && t.taxonomy_term.label_de)
          epochs.add(t.taxonomy_term.label_de);
      });
      const theaterName = (c.theater as { name?: string } | null)?.name;
      if (theaterName) theaters.add(theaterName);
      const loc = c.costume_items?.[0]?.storage_location_path;
      if (loc) standorte.add(loc.split(".")[0]);
    });
    return {
      epochs: [...epochs].sort(),
      theaters: [...theaters].sort(),
      standorte: [...standorte].sort(),
    };
  }, [costumes]);

  const filteredCostumes = useMemo(() => {
    return costumes.filter((c) => {
      if (filters.status) {
        if ((c.costume_items?.[0]?.current_status ?? "available") !== filters.status) return false;
      }
      if (filters.gender) {
        if (c.gender_term?.label_de !== filters.gender) return false;
      }
      if (filters.clothingType) {
        if (c.clothing_type?.label_de !== filters.clothingType) return false;
      }
      if (filters.epoch) {
        const has = c.costume_taxonomy?.some(
          (t) => t.taxonomy_term?.vocabulary === "epoch" && t.taxonomy_term.label_de === filters.epoch
        );
        if (!has) return false;
      }
      if (filters.theater) {
        if ((c.theater as { name?: string } | null)?.name !== filters.theater) return false;
      }
      if (filters.standort) {
        const loc = c.costume_items?.[0]?.storage_location_path ?? "";
        if (loc.split(".")[0] !== filters.standort) return false;
      }
      return true;
    });
  }, [costumes, filters]);

  const sortedCostumes = useMemo(() => {
    return [...filteredCostumes].sort((a, b) => {
      switch (sort) {
        case "name_asc":  return a.name.localeCompare(b.name, "de");
        case "name_desc": return b.name.localeCompare(a.name, "de");
        case "newest":    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });
  }, [filteredCostumes, sort]);

  const anyFilterActive = Object.values(filters).some(Boolean);
  function clearFilters() { setFilters({ status: "", gender: "", clothingType: "", epoch: "", theater: "", standort: "" }); }
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusMenuOpen, setBulkStatusMenuOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDuplicating, setBulkDuplicating] = useState(false);
  const [showBulkDeleteSheet, setShowBulkDeleteSheet] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const allSelected = costumes.length > 0 && selectedIds.size === costumes.length;

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(costumes.map((c) => c.id)));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitEditMode() {
    setEditMode(false);
    setSelectedIds(new Set());
    setBulkStatusMenuOpen(false);
  }

  async function handleBulkDuplicate() {
    if (selectedIds.size === 0) return;
    setBulkDuplicating(true);
    try {
      await Promise.all([...selectedIds].map((id) => duplicateCostume(supabase, id)));
      await queryClient.invalidateQueries({ queryKey: ["costumes", queryIds] });
      router.refresh();
      setSelectedIds(new Set());
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Duplizieren fehlgeschlagen");
    } finally {
      setBulkDuplicating(false);
    }
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    try {
      const selected = costumes.filter((c) => selectedIds.has(c.id));
      await Promise.all(
        selected.map((c) => {
          const mediaPaths = (c.costume_media ?? []).map((m) => m.storage_path);
          return deleteCostume(supabase, c.id, mediaPaths);
        })
      );
      await queryClient.invalidateQueries({ queryKey: ["costumes", queryIds] });
      router.refresh();
      setSelectedIds(new Set());
      setShowBulkDeleteSheet(false);
      setEditMode(false);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
      setBulkDeleting(false);
      setShowBulkDeleteSheet(false);
    }
  }

  async function handleBulkStatusChange(value: string) {
    setBulkStatusMenuOpen(false);
    const selected = costumes.filter((c) => selectedIds.has(c.id));
    try {
      await Promise.all(
        selected.map(async (costume) => {
          const items = costume.costume_items ?? [];
          if (items.length > 0) {
            const results = await Promise.all(
              items.map((item) =>
                supabase.from("costume_items").update({ current_status: value }).eq("id", item.id)
              )
            );
            const failed = results.find((r) => r.error);
            if (failed?.error) throw new Error(failed.error.message);
          } else {
            const { error } = await supabase.from("costume_items").insert({
              costume_id: costume.id,
              theater_id: costume.theater_id,
              barcode_id: crypto.randomUUID(),
              current_status: value,
            });
            if (error) throw new Error(error.message);
          }
        })
      );
      await queryClient.invalidateQueries({ queryKey: ["costumes", queryIds] });
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Status-Änderung fehlgeschlagen");
    }
  }

  const selectedCount = selectedIds.size;

  return (
    <div className={styles.page}>
      {editMode ? (
        <div className={styles.bulkHeader}>
          <div className={styles.bulkHeaderLeft}>
            <button
              type="button"
              className={`${styles.bulkCheckbox} ${allSelected ? styles.bulkCheckboxChecked : ""}`}
              onClick={toggleSelectAll}
              aria-label="Alle auswählen"
            >
              {allSelected && <span className={styles.bulkCheckboxInner} />}
            </button>
            <h1 className={styles.heading}>Kostüme</h1>
          </div>
          <div className={styles.bulkHeaderRight}>
            <button
              type="button"
              className={styles.bulkBtn}
              onClick={handleBulkDuplicate}
              disabled={selectedCount === 0 || bulkDuplicating}
            >
              {bulkDuplicating ? "…" : "duplizieren"}
            </button>
            <button
              type="button"
              className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`}
              onClick={() => setShowBulkDeleteSheet(true)}
              disabled={selectedCount === 0 || bulkDeleting}
            >
              löschen
            </button>

            {/* Bulk status dropdown */}
            <div className={styles.bulkStatusWrap}>
              <button
                type="button"
                className={styles.bulkBtn}
                onClick={() => setBulkStatusMenuOpen((v) => !v)}
                disabled={selectedCount === 0}
              >
                Status ändern
                <span className="dropdown-arrow" />
              </button>
              {bulkStatusMenuOpen && (
                <>
                  <div
                    className={styles.statusBackdrop}
                    onClick={() => setBulkStatusMenuOpen(false)}
                  />
                  <div className={styles.bulkStatusMenu}>
                    {STATUS_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => handleBulkStatusChange(o.value)}
                        className={styles.statusOption}
                      >
                        <span className={styles.statusDot} style={{ background: o.color }} />
                        {o.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              className={styles.bulkClose}
              onClick={exitEditMode}
              aria-label="Bearbeiten beenden"
            >
              ×
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.heading}>Kostüme</h1>
            <div className={styles.viewToggle}>
              <button
                type="button"
                className={`${styles.viewBtn} ${view === "list" ? styles.viewBtnActive : ""}`}
                onClick={() => setView("list")}
                aria-label="Listenansicht"
              >
                <Image src="/icons/icon-list.svg" alt="" width={20} height={20} />
              </button>
              <div className={styles.viewDivider} />
              <button
                type="button"
                className={`${styles.viewBtn} ${view === "grid" ? styles.viewBtnActive : ""}`}
                onClick={() => setView("grid")}
                aria-label="Bildansicht"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="7" height="7" rx="1" fill="currentColor"/>
                  <rect x="11" y="2" width="7" height="7" rx="1" fill="currentColor"/>
                  <rect x="2" y="11" width="7" height="7" rx="1" fill="currentColor"/>
                  <rect x="11" y="11" width="7" height="7" rx="1" fill="currentColor"/>
                </svg>
              </button>
              <div className={styles.viewDivider} />
              <select
                className={styles.sortSelect}
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                aria-label="Sortierung"
              >
                <option value="name_asc">Name A–Z</option>
                <option value="name_desc">Name Z–A</option>
                <option value="newest">Neueste zuerst</option>
                <option value="oldest">Älteste zuerst</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            className={styles.listEdit}
            onClick={() => setEditMode(true)}
          >
            Liste bearbeiten
          </button>
        </div>
      )}

      {bulkError && (
        <div className={styles.cardError} style={{ marginBottom: 0 }}>
          {bulkError}
          <button
            type="button"
            onClick={() => setBulkError(null)}
            className={styles.cardErrorClose}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter bar */}
      {costumes.length > 0 && !editMode && (
        <div className={styles.filterBar}>
          {/* Status — custom dropdown with color dots */}
          <StatusFilterChip
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          />
          {/* Kategorie (gender) — hardcoded full list */}
          <select
            className={`${styles.filterChip} ${filters.gender ? styles.filterChipActive : ""}`}
            value={filters.gender}
            onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
          >
            <option value="">Kategorie</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {/* Bekleidungsart — full taxonomy list from server */}
          {clothingOptions.length > 0 && (
            <select
              className={`${styles.filterChip} ${filters.clothingType ? styles.filterChipActive : ""}`}
              value={filters.clothingType}
              onChange={(e) => setFilters((f) => ({ ...f, clothingType: e.target.value }))}
            >
              <option value="">Bekleidungsart</option>
              {clothingOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
          {/* Epoche — dynamic from loaded costumes */}
          {filterOptions.epochs.length > 0 && (
            <select
              className={`${styles.filterChip} ${filters.epoch ? styles.filterChipActive : ""}`}
              value={filters.epoch}
              onChange={(e) => setFilters((f) => ({ ...f, epoch: e.target.value }))}
            >
              <option value="">Epoche</option>
              {filterOptions.epochs.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          )}
          {/* Theater — nur wenn mehrere Theater vorhanden */}
          {filterOptions.theaters.length > 1 && (
            <select
              className={`${styles.filterChip} ${filters.theater ? styles.filterChipActive : ""}`}
              value={filters.theater}
              onChange={(e) => setFilters((f) => ({ ...f, theater: e.target.value }))}
            >
              <option value="">Theater</option>
              {filterOptions.theaters.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
          {/* Standort — erste Ebene des storage_location_path */}
          {filterOptions.standorte.length > 0 && (
            <select
              className={`${styles.filterChip} ${filters.standort ? styles.filterChipActive : ""}`}
              value={filters.standort}
              onChange={(e) => setFilters((f) => ({ ...f, standort: e.target.value }))}
            >
              <option value="">Standort</option>
              {filterOptions.standorte.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          {anyFilterActive && (
            <button type="button" className={styles.clearFilters} onClick={clearFilters}>
              × Zurücksetzen
            </button>
          )}
          {anyFilterActive && (
            <span className={styles.filterCount}>
              {sortedCostumes.length} von {costumes.length}
            </span>
          )}
        </div>
      )}

      {costumes.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Noch keine Kostüme erfasst.</p>
          <Link href="/kostueme/neu" className="btn-primary">Kostüm erfassen</Link>
        </div>
      ) : view === "grid" ? (
        <div className={styles.grid}>
          {sortedCostumes.map((costume) => (
            <CostumeCard
              key={costume.id}
              costume={costume}
              queryIds={queryIds}
              editMode={editMode}
              isSelected={selectedIds.has(costume.id)}
              onToggleSelect={() => toggleSelect(costume.id)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {sortedCostumes.map((costume) => (
            <CostumeListRow
              key={costume.id}
              costume={costume}
              queryIds={queryIds}
              editMode={editMode}
              isSelected={selectedIds.has(costume.id)}
              onToggleSelect={() => toggleSelect(costume.id)}
            />
          ))}
        </div>
      )}

      {showBulkDeleteSheet && (
        <DeleteConfirmationSheet
          itemName={
            selectedCount === 1
              ? (costumes.find((c) => selectedIds.has(c.id))?.name ?? "das Kostüm")
              : `${selectedCount} Kostüme`
          }
          isDeleting={bulkDeleting}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteSheet(false)}
        />
      )}
    </div>
  );
}

function StatusFilterChip({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = STATUS_OPTIONS.find((o) => o.value === value) ?? null;

  return (
    <div className={styles.statusFilterWrap}>
      <button
        type="button"
        className={`${styles.filterChip} ${styles.filterChipWithDot} ${value ? styles.filterChipActive : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        {selected && <span className={styles.statusDot} style={{ background: selected.color }} />}
        <span>{selected ? selected.label : "Status"}</span>
        <span className={styles.filterChipArrow} />
      </button>
      {open && (
        <>
          <div className={styles.statusBackdrop} onClick={() => setOpen(false)} />
          <div className={styles.statusFilterMenu}>
            <button
              type="button"
              className={styles.statusOption}
              onClick={() => { onChange(""); setOpen(false); }}
            >
              <span className={styles.statusDot} style={{ background: "var(--neutral-grey-300)" }} />
              Alle
            </button>
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`${styles.statusOption} ${o.value === value ? styles.statusOptionActive : ""}`}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                <span className={styles.statusDot} style={{ background: o.color }} />
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface CostumeCardProps {
  costume: Costume;
  queryIds: string[];
  editMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}

function CostumeCard({
  costume,
  queryIds,
  editMode,
  isSelected,
  onToggleSelect,
}: CostumeCardProps) {
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  const itemId = costume.costume_items?.[0]?.id ?? null;
  const [currentStatus, setCurrentStatus] = useState(
    costume.costume_items?.[0]?.current_status ?? "available"
  );
  useEffect(() => {
    setCurrentStatus(costume.costume_items?.[0]?.current_status ?? "available");
  }, [costume.costume_items]);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const imageUrl = costume.costume_media?.[0]
    ? getPublicUrl(supabase, costume.costume_media[0].storage_path)
    : null;

  const selectedStatus = STATUS_OPTIONS.find((o) => o.value === currentStatus) ?? STATUS_OPTIONS[0];
  const genderIcon = getGenderIcon((costume.gender_term as { label_de?: string } | null)?.label_de);

  const firstProvenance = costume.costume_provenance?.[0];
  const subtitle = firstProvenance
    ? [firstProvenance.production_title, firstProvenance.year].filter(Boolean).join(" / ")
    : null;

  async function handleStatusChange(value: string) {
    setCurrentStatus(value);
    setStatusMenuOpen(false);
    if (itemId) {
      await supabase.from("costume_items").update({ current_status: value }).eq("id", itemId);
    } else {
      await supabase.from("costume_items").insert({
        costume_id: costume.id,
        theater_id: costume.theater_id,
        barcode_id: crypto.randomUUID(),
        current_status: value,
      });
      await queryClient.invalidateQueries({ queryKey: ["costumes", queryIds] });
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const mediaPaths = (costume.costume_media ?? []).map((m) => m.storage_path);
      await deleteCostume(supabase, costume.id, mediaPaths);
      await queryClient.invalidateQueries({ queryKey: ["costumes", queryIds] });
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
      setDeleting(false);
      setShowDeleteSheet(false);
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    setMenuOpen(false);
    try {
      await duplicateCostume(supabase, costume.id);
      await queryClient.invalidateQueries({ queryKey: ["costumes", queryIds] });
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Duplizieren fehlgeschlagen");
    } finally {
      setDuplicating(false);
    }
  }

  const moreItems = [
    {
      label: "Bearbeiten",
      action: () => { setMenuOpen(false); router.push(`/kostueme/neu?edit=${costume.id}`); },
    },
    { label: "Duplizieren", action: handleDuplicate },
    {
      label: "Löschen",
      action: () => { setMenuOpen(false); setShowDeleteSheet(true); },
      danger: true,
    },
  ];

  const imageContent = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={costume.name} />
  ) : (
    <Image
      src="/icons/icon-shirt.svg"
      alt=""
      width={40}
      height={40}
      className={styles.cardImagePlaceholder}
    />
  );

  return (
    <>
      {actionError && (
        <div className={styles.cardError}>
          {actionError}
          <button
            type="button"
            onClick={() => setActionError(null)}
            className={styles.cardErrorClose}
          >
            ✕
          </button>
        </div>
      )}
      <div
        role="article"
        className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
        style={{ zIndex: (statusMenuOpen || menuOpen) ? 10 : undefined }}
      >
        {/* Image */}
        {editMode ? (
          <div className={styles.cardImage} onClick={onToggleSelect} style={{ cursor: "pointer" }}>
            {imageContent}
            <button
              type="button"
              className={`${styles.cardCheckbox} ${isSelected ? styles.cardCheckboxChecked : ""}`}
              onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
              aria-label={isSelected ? "Abwählen" : "Auswählen"}
            >
              {isSelected && <span className={styles.cardCheckboxInner} />}
            </button>
          </div>
        ) : (
          <Link href={`/costume/${costume.id}`} className={styles.cardImage}>
            {imageContent}
          </Link>
        )}

        {/* Body */}
        {editMode ? (
          <div
            className={styles.cardBody}
            onClick={onToggleSelect}
            style={{ cursor: "pointer", textDecoration: "none" }}
          >
            <p className={styles.cardName}>{costume.name}</p>
            {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
          </div>
        ) : (
          <Link href={`/costume/${costume.id}`} className={styles.cardBody} style={{ textDecoration: "none" }}>
            <p className={styles.cardName}>{costume.name}</p>
            {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
          </Link>
        )}

        {/* Actions row */}
        <div className={styles.cardActions}>
          {/* Status dropdown */}
          <div className={styles.statusWrap}>
            <button
              type="button"
              className={styles.statusTrigger}
              onClick={() => setStatusMenuOpen((v) => !v)}
            >
              <span className={styles.statusDot} style={{ background: selectedStatus.color }} />
              <span>{selectedStatus.label}</span>
              <span className="dropdown-arrow" />
            </button>
            {statusMenuOpen && (
              <>
                <div className={styles.statusBackdrop} onClick={() => setStatusMenuOpen(false)} />
                <div className={styles.statusMenu}>
                  {STATUS_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => handleStatusChange(o.value)}
                      className={`${styles.statusOption} ${o.value === currentStatus ? styles.statusOptionActive : ""}`}
                    >
                      <span className={styles.statusDot} style={{ background: o.color }} />
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Gender + clothing icons */}
          <div className={styles.iconGroup}>
            <Image
              src={`/icons/icon-${genderIcon}.svg`}
              alt={costume.gender_term?.label_de ?? ""}
              width={18}
              height={18}
            />
            <div className={styles.iconDivider} />
            <Image src="/icons/icon-shirt.svg" alt="" width={18} height={18} />
          </div>

          {/* More menu */}
          <ContextMenu
            items={moreItems}
            isOpen={menuOpen}
            onToggle={() => setMenuOpen((o) => !o)}
            onClose={() => setMenuOpen(false)}
            align="right"
            disabled={duplicating}
          />
        </div>
      </div>

      {showDeleteSheet && (
        <DeleteConfirmationSheet
          itemName={costume.name}
          isDeleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteSheet(false)}
        />
      )}
    </>
  );
}

function CostumeListRow({
  costume,
  queryIds,
  editMode,
  isSelected,
  onToggleSelect,
}: CostumeCardProps) {
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  const itemId = costume.costume_items?.[0]?.id ?? null;
  const [currentStatus, setCurrentStatus] = useState(
    costume.costume_items?.[0]?.current_status ?? "available"
  );
  useEffect(() => {
    setCurrentStatus(costume.costume_items?.[0]?.current_status ?? "available");
  }, [costume.costume_items]);

  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const imageUrl = costume.costume_media?.[0]
    ? getPublicUrl(supabase, costume.costume_media[0].storage_path)
    : null;

  const selectedStatus = STATUS_OPTIONS.find((o) => o.value === currentStatus) ?? STATUS_OPTIONS[0];
  const genderIcon = getGenderIcon((costume.gender_term as { label_de?: string } | null)?.label_de);
  const firstProvenance = costume.costume_provenance?.[0];
  const productionLabel = firstProvenance
    ? [firstProvenance.production_title, firstProvenance.year].filter(Boolean).join(" / ")
    : null;

  async function handleStatusChange(value: string) {
    setCurrentStatus(value);
    setStatusMenuOpen(false);
    if (itemId) {
      await supabase.from("costume_items").update({ current_status: value }).eq("id", itemId);
    } else {
      await supabase.from("costume_items").insert({
        costume_id: costume.id,
        theater_id: costume.theater_id,
        barcode_id: crypto.randomUUID(),
        current_status: value,
      });
      await queryClient.invalidateQueries({ queryKey: ["costumes", queryIds] });
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const mediaPaths = (costume.costume_media ?? []).map((m) => m.storage_path);
      await deleteCostume(supabase, costume.id, mediaPaths);
      await queryClient.invalidateQueries({ queryKey: ["costumes", queryIds] });
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
      setDeleting(false);
      setShowDeleteSheet(false);
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    setMenuOpen(false);
    try {
      await duplicateCostume(supabase, costume.id);
      await queryClient.invalidateQueries({ queryKey: ["costumes", queryIds] });
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Duplizieren fehlgeschlagen");
    } finally {
      setDuplicating(false);
    }
  }

  const moreItems = [
    { label: "Bearbeiten", action: () => { setMenuOpen(false); router.push(`/kostueme/neu?edit=${costume.id}`); } },
    { label: "Duplizieren", action: handleDuplicate },
    { label: "Löschen", action: () => { setMenuOpen(false); setShowDeleteSheet(true); }, danger: true },
  ];

  return (
    <>
      {actionError && (
        <div className={styles.cardError}>
          {actionError}
          <button type="button" onClick={() => setActionError(null)} className={styles.cardErrorClose}>✕</button>
        </div>
      )}
      <div
        role="article"
        className={`${styles.listRow} ${isSelected ? styles.cardSelected : ""}`}
        style={{ zIndex: (statusMenuOpen || menuOpen) ? 10 : undefined }}
      >
        {/* Left: checkbox (edit mode) or 3-dot menu */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 4px 0 12px", flexShrink: 0 }}>
          {editMode ? (
            <button
              type="button"
              className={styles.listCheckbox}
              onClick={onToggleSelect}
              aria-label={isSelected ? "Abwählen" : "Auswählen"}
            >
              {isSelected && <span className={styles.cardCheckboxInner} />}
            </button>
          ) : (
            <ContextMenu
              items={moreItems}
              isOpen={menuOpen}
              onToggle={() => setMenuOpen((o) => !o)}
              onClose={() => setMenuOpen(false)}
              disabled={duplicating}
              align="left"
            />
          )}
        </div>

        {/* Thumbnail + Name — clickable in edit mode */}
        {editMode ? (
          <div
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "0 8px", cursor: "pointer" }}
            onClick={onToggleSelect}
          >
            <div style={{ width: 46, height: 46, borderRadius: "100px", overflow: "hidden", flexShrink: 0, background: "var(--neutral-grey-300)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {imageUrl
                ? <img src={imageUrl} alt={costume.name} style={{ objectFit: "cover", width: "100%", height: "100%" }} /> // eslint-disable-line @next/next/no-img-element
                : <Image src="/icons/icon-shirt.svg" alt="" width={24} height={24} style={{ opacity: 0.4 }} />
              }
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: "var(--font-size-50)", color: "var(--neutral-grey-500)", fontFamily: "var(--font-family-base)" }}>
                ID-{costume.id.slice(0, 9).toUpperCase()}
              </span>
              <span style={{ fontSize: "var(--font-size-200)", fontWeight: "var(--font-weight-500)", color: "var(--neutral-black)", fontFamily: "var(--font-family-base)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {costume.name}
              </span>
            </div>
          </div>
        ) : (
          <Link href={`/costume/${costume.id}`} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "0 8px", textDecoration: "none" }}>
            <div style={{ width: 46, height: 46, borderRadius: "100px", overflow: "hidden", flexShrink: 0, background: "var(--neutral-grey-300)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {imageUrl
                ? <img src={imageUrl} alt={costume.name} style={{ objectFit: "cover", width: "100%", height: "100%" }} /> // eslint-disable-line @next/next/no-img-element
                : <Image src="/icons/icon-shirt.svg" alt="" width={24} height={24} style={{ opacity: 0.4 }} />
              }
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: "var(--font-size-50)", color: "var(--neutral-grey-500)", fontFamily: "var(--font-family-base)" }}>
                ID-{costume.id.slice(0, 9).toUpperCase()}
              </span>
              <span style={{ fontSize: "var(--font-size-200)", fontWeight: "var(--font-weight-500)", color: "var(--neutral-black)", fontFamily: "var(--font-family-base)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {costume.name}
              </span>
            </div>
          </Link>
        )}

        {/* Production label */}
        <span className={styles.listProductionLabel}>{productionLabel}</span>

        {/* Gender + shirt badge */}
        <div className={styles.listGenderBadge}>
          <Image src={`/icons/icon-${genderIcon}.svg`} alt={costume.gender_term?.label_de ?? ""} width={16} height={16} />
          <div style={{ width: "0.8px", height: 20, background: "var(--neutral-grey-300)" }} />
          <Image src="/icons/icon-shirt.svg" alt="" width={16} height={16} />
        </div>

        {/* Status dropdown */}
        <div className={styles.statusWrap} style={{ marginRight: 16 }}>
          <button type="button" className={styles.statusTrigger} onClick={() => setStatusMenuOpen((v) => !v)}>
            <span className={styles.statusDot} style={{ background: selectedStatus.color }} />
            <span>{selectedStatus.label}</span>
            <span className="dropdown-arrow" />
          </button>
          {statusMenuOpen && (
            <>
              <div className={styles.statusBackdrop} onClick={() => setStatusMenuOpen(false)} />
              <div className={styles.statusMenuDown}>
                {STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => handleStatusChange(o.value)}
                    className={`${styles.statusOption} ${o.value === currentStatus ? styles.statusOptionActive : ""}`}
                  >
                    <span className={styles.statusDot} style={{ background: o.color }} />
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showDeleteSheet && (
        <DeleteConfirmationSheet
          itemName={costume.name}
          isDeleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteSheet(false)}
        />
      )}
    </>
  );
}
