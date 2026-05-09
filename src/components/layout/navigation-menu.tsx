"use client";

import { useState } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants/app";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  ChevronRight,
  ArrowLeft,
  MessageCircle,
  HelpCircle,
  Globe,
  Headphones,
  User,
  PersonStanding,
  Users,
  Baby,
  Dog,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TaxonomyTerm } from "@/lib/types/costume";
import type { LucideIcon } from "lucide-react";
import { t } from "@/lib/i18n";

const genderIcons: Record<string, LucideIcon> = {
  Damen: User,
  Herren: PersonStanding,
  Unisex: Users,
  Kinder: Baby,
  Tier: Dog,
  Fantasy: Sparkles,
};

type NavigationMenuProps = {
  open: boolean;
  onClose: () => void;
};

type MenuLevel = "root" | "clothing_types" | "sub_types";

export function NavigationMenu({ open, onClose }: NavigationMenuProps) {
  const [level, setLevel] = useState<MenuLevel>("root");
  const [selectedGender, setSelectedGender] = useState<TaxonomyTerm | null>(null);
  const [selectedClothingType, setSelectedClothingType] = useState<TaxonomyTerm | null>(null);

  const supabase = createClient();

  const { data: genders } = useQuery({
    queryKey: ["taxonomy", "gender"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taxonomy_terms")
        .select("*")
        .eq("vocabulary", "gender")
        .order("sort_order");
      if (error) throw error;
      return data as TaxonomyTerm[];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: clothingTypes } = useQuery({
    queryKey: ["taxonomy", "clothing_type", "top"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taxonomy_terms")
        .select("*")
        .eq("vocabulary", "clothing_type")
        .is("parent_id", null)
        .order("sort_order");
      if (error) throw error;
      return data as TaxonomyTerm[];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: subTypes } = useQuery({
    queryKey: ["taxonomy", "clothing_type", "sub", selectedClothingType?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("taxonomy_terms")
        .select("*")
        .eq("vocabulary", "clothing_type")
        .eq("parent_id", selectedClothingType!.id)
        .order("sort_order");
      if (error) throw error;
      return data as TaxonomyTerm[];
    },
    enabled: open && level === "sub_types" && !!selectedClothingType,
    staleTime: 5 * 60 * 1000,
  });

  function handleClose() {
    onClose();
    // Reset to root after close animation
    setTimeout(() => {
      setLevel("root");
      setSelectedGender(null);
      setSelectedClothingType(null);
    }, 200);
  }

  function handleGenderTap(gender: TaxonomyTerm) {
    setSelectedGender(gender);
    setLevel("clothing_types");
  }

  function handleClothingTypeTap(ct: TaxonomyTerm) {
    setSelectedClothingType(ct);
    setLevel("sub_types");
  }

  function handleBack() {
    if (level === "sub_types") {
      setLevel("clothing_types");
      setSelectedClothingType(null);
    } else if (level === "clothing_types") {
      setLevel("root");
      setSelectedGender(null);
    }
  }

  if (!open) return null;

  return (
    <div className="bg-surface-dark text-surface-dark-foreground fixed inset-0 z-[60] flex flex-col">
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4">
        {level !== "root" ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-surface-dark-foreground gap-1"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            {level === "clothing_types" ? t("nav.overview") : t("nav.clothingType")}
          </Button>
        ) : (
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-surface-dark-foreground"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">{t("header.closeMenu")}</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {level === "root" && (
          <RootMenu genders={genders ?? []} onGenderTap={handleGenderTap} onClose={handleClose} />
        )}
        {level === "clothing_types" && selectedGender && (
          <ClothingTypeMenu
            gender={selectedGender}
            clothingTypes={clothingTypes ?? []}
            onClothingTypeTap={handleClothingTypeTap}
            onClose={handleClose}
          />
        )}
        {level === "sub_types" && selectedGender && selectedClothingType && (
          <SubTypeMenu
            gender={selectedGender}
            clothingType={selectedClothingType}
            subTypes={subTypes ?? []}
            onClose={handleClose}
          />
        )}
      </div>

      {/* Mein Profil bar at bottom */}
      <div className="border-surface-dark-foreground/10 border-t px-4 py-3">
        <Link
          href="/profile"
          className="hover:bg-surface-dark-foreground/10 flex items-center gap-3 rounded-lg p-2 transition-colors"
          onClick={handleClose}
        >
          <div className="bg-surface-dark-foreground/20 flex h-10 w-10 items-center justify-center rounded-full">
            <User className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium">{t("nav.myProfile")}</span>
        </Link>
      </div>
    </div>
  );
}

// ─── Level 1: Root Menu ─────────────────────────────────────────────

function RootMenu({
  genders,
  onGenderTap,
  onClose,
}: {
  genders: TaxonomyTerm[];
  onGenderTap: (g: TaxonomyTerm) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Kostüme section */}
      <div>
        <h2 className="text-surface-dark-foreground/50 mb-3 text-xs font-semibold tracking-wider uppercase">
          {t("nav.costumes")}
        </h2>
        <div className="flex flex-col gap-1">
          {genders.map((gender) => {
            const Icon = genderIcons[gender.label_de] ?? User;
            return (
              <button
                key={gender.id}
                type="button"
                className="hover:bg-surface-dark-foreground/10 flex items-center justify-between rounded-lg p-3 text-left transition-colors"
                onClick={() => onGenderTap(gender)}
              >
                <div className="flex items-center gap-3">
                  <Icon className="text-surface-dark-foreground/70 h-5 w-5" />
                  <span className="text-sm font-medium">{gender.label_de}</span>
                </div>
                <ChevronRight className="text-surface-dark-foreground/40 h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Netzwerk & Support section */}
      <div>
        <h2 className="text-surface-dark-foreground/50 mb-3 text-xs font-semibold tracking-wider uppercase">
          {t("nav.networkAndSupport")}
        </h2>
        <div className="flex flex-col gap-1">
          <MenuLink
            href="/messages"
            icon={MessageCircle}
            label={t("nav.messages")}
            onClose={onClose}
          />
          <MenuLink
            href="/anfragen"
            icon={HelpCircle}
            label={t("nav.costumeInquiries")}
            onClose={onClose}
          />
          <MenuLink href="/netzwerk" icon={Globe} label={t("nav.network")} onClose={onClose} />
          <MenuLink href="/support" icon={Headphones} label={t("nav.support")} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

// ─── Level 2: Clothing Types for a Gender ───────────────────────────

function ClothingTypeMenu({
  gender,
  clothingTypes,
  onClothingTypeTap,
  onClose,
}: {
  gender: TaxonomyTerm;
  clothingTypes: TaxonomyTerm[];
  onClothingTypeTap: (ct: TaxonomyTerm) => void;
  onClose: () => void;
}) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-bold">{gender.label_de}</h2>
      <p className="text-surface-dark-foreground/50 mb-4 text-xs">{t("nav.clothingType")}</p>

      {/* "Alle anzeigen" link for this gender */}
      <Link
        href={`/fundus?gender=${encodeURIComponent(gender.label_de)}`}
        className="bg-surface-dark-foreground/5 hover:bg-surface-dark-foreground/10 mb-2 flex items-center justify-between rounded-lg p-3 transition-colors"
        onClick={onClose}
      >
        <span className="text-sm font-medium">{t("nav.showAll", { label: gender.label_de })}</span>
        <ChevronRight className="text-surface-dark-foreground/40 h-4 w-4" />
      </Link>

      <div className="flex flex-col gap-1">
        {clothingTypes.map((ct) => (
          <button
            key={ct.id}
            type="button"
            className="hover:bg-surface-dark-foreground/10 flex items-center justify-between rounded-lg p-3 text-left transition-colors"
            onClick={() => onClothingTypeTap(ct)}
          >
            <span className="text-sm font-medium">{ct.label_de}</span>
            <ChevronRight className="text-surface-dark-foreground/40 h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Level 3: Sub-types for a Clothing Type ─────────────────────────

function SubTypeMenu({
  gender,
  clothingType,
  subTypes,
  onClose,
}: {
  gender: TaxonomyTerm;
  clothingType: TaxonomyTerm;
  subTypes: TaxonomyTerm[];
  onClose: () => void;
}) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-bold">{clothingType.label_de}</h2>
      <p className="text-surface-dark-foreground/50 mb-4 text-xs">
        {gender.label_de} &rsaquo; {clothingType.label_de}
      </p>

      {/* "Alle anzeigen" link for this clothing type + gender */}
      <Link
        href={`/fundus?gender=${encodeURIComponent(gender.label_de)}&clothingType=${encodeURIComponent(clothingType.label_de)}`}
        className="bg-surface-dark-foreground/5 hover:bg-surface-dark-foreground/10 mb-2 flex items-center justify-between rounded-lg p-3 transition-colors"
        onClick={onClose}
      >
        <span className="text-sm font-medium">
          {t("nav.showAll", { label: clothingType.label_de })}
        </span>
        <ChevronRight className="text-surface-dark-foreground/40 h-4 w-4" />
      </Link>

      {subTypes.length > 0 ? (
        <div className="flex flex-col gap-1">
          {subTypes.map((sub) => (
            <Link
              key={sub.id}
              href={`/fundus?gender=${encodeURIComponent(gender.label_de)}&clothingType=${encodeURIComponent(sub.label_de)}`}
              className="hover:bg-surface-dark-foreground/10 flex items-center justify-between rounded-lg p-3 transition-colors"
              onClick={onClose}
            >
              <span className="text-sm font-medium">{sub.label_de}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-surface-dark-foreground/50 p-3 text-sm">{t("common.noResults")}</p>
      )}
    </div>
  );
}

// ─── Shared link item ───────────────────────────────────────────────

function MenuLink({
  href,
  icon: Icon,
  label,
  onClose,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      className="hover:bg-surface-dark-foreground/10 flex items-center gap-3 rounded-lg p-3 transition-colors"
      onClick={onClose}
    >
      <Icon className="text-surface-dark-foreground/70 h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
