"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, X } from "lucide-react";
import { generateBarcodeId } from "@/lib/helpers/barcode";
import type { TaxonomyTerm, CostumeFormData } from "@/lib/types/costume";
import Link from "next/link";
import { t } from "@/lib/i18n";

interface CostumeFormProps {
  theaterId: string;
  initialTaxonomy: {
    genders: TaxonomyTerm[];
    clothingTypes: TaxonomyTerm[];
    materials: TaxonomyTerm[];
    colors: TaxonomyTerm[];
    epochs: TaxonomyTerm[];
  };
}

const initialFormData: CostumeFormData = {
  name: "",
  description: "",
  gender_term_id: "",
  clothing_type_id: "",
  material_ids: [],
  color_ids: [],
  epoch_ids: [],
  size_label: "",
  production_title: "",
  production_year: "",
  role_name: "",
  photo: null,
};

export function CostumeForm({ theaterId, initialTaxonomy }: CostumeFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CostumeFormData>(initialFormData);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Separate top-level and sub-type clothing types
  const topLevelClothingTypes = initialTaxonomy.clothingTypes.filter(
    (t) => !t.parent_id
  );
  const subClothingTypes = initialTaxonomy.clothingTypes.filter(
    (t) => t.parent_id
  );

  const createCostume = useMutation({
    mutationFn: async (data: CostumeFormData) => {
      // Step 1: INSERT costume
      const { data: costume, error: costumeError } = await supabase
        .from("costumes")
        .insert({
          theater_id: theaterId,
          name: data.name,
          description: data.description || null,
          gender_term_id: data.gender_term_id || null,
          clothing_type_id: data.clothing_type_id || null,
        })
        .select("id")
        .single();

      if (costumeError) throw costumeError;
      const costumeId = costume.id;

      // Step 2: INSERT costume_item
      const { error: itemError } = await supabase
        .from("costume_items")
        .insert({
          costume_id: costumeId,
          theater_id: theaterId,
          barcode_id: generateBarcodeId(),
          size_label: data.size_label || null,
        });

      if (itemError) throw itemError;

      // Step 3: INSERT costume_taxonomy rows
      const taxonomyRows = [
        ...data.material_ids.map((id) => ({ costume_id: costumeId, term_id: id })),
        ...data.color_ids.map((id) => ({ costume_id: costumeId, term_id: id })),
        ...data.epoch_ids.map((id) => ({ costume_id: costumeId, term_id: id })),
      ];

      if (taxonomyRows.length > 0) {
        const { error: taxError } = await supabase
          .from("costume_taxonomy")
          .insert(taxonomyRows);

        if (taxError) throw taxError;
      }

      // Step 4: INSERT costume_provenance (if provided)
      if (data.production_title.trim()) {
        const { error: provError } = await supabase
          .from("costume_provenance")
          .insert({
            costume_id: costumeId,
            production_title: data.production_title.trim(),
            year: data.production_year ? parseInt(data.production_year) : null,
            role_name: data.role_name.trim() || null,
          });

        if (provError) throw provError;
      }

      // Step 5: Upload photo + INSERT costume_media
      if (data.photo) {
        const ext = data.photo.name.split(".").pop();
        const storagePath = `${theaterId}/${costumeId}/main.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("costume-images")
          .upload(storagePath, data.photo);

        if (uploadError) throw uploadError;

        const { error: mediaError } = await supabase
          .from("costume_media")
          .insert({
            costume_id: costumeId,
            storage_path: storagePath,
            sort_order: 0,
          });

        if (mediaError) throw mediaError;
      }

      return costumeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costumes"] });
      router.push("/fundus");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    createCostume.mutate(form);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, photo: file }));

    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  }

  function removePhoto() {
    setForm((prev) => ({ ...prev, photo: null }));
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleTerm(
    field: "material_ids" | "color_ids" | "epoch_ids",
    termId: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(termId)
        ? prev[field].filter((id) => id !== termId)
        : [...prev[field], termId],
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/fundus">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">{t("common.back")}</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{t("costumeForm.newCostume")}</h1>
      </div>

      {/* === Grunddaten === */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("costumeForm.basicData")}</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={t("costumeForm.namePlaceholder")}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">{t("costumeForm.description")}</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={t("costumeForm.descriptionPlaceholder")}
            rows={3}
          />
        </div>
      </section>

      <Separator />

      {/* === Kategorisierung === */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("costumeForm.categorization")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>{t("costumeForm.gender")}</Label>
            <Select
              value={form.gender_term_id}
              onValueChange={(val) => setForm((prev) => ({ ...prev, gender_term_id: val }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("costumeForm.genderPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {initialTaxonomy.genders.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.label_de}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("costumeForm.clothingType")}</Label>
            <Select
              value={form.clothing_type_id}
              onValueChange={(val) => setForm((prev) => ({ ...prev, clothing_type_id: val }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("costumeForm.clothingTypePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {topLevelClothingTypes.map((parent) => {
                  const children = subClothingTypes.filter(
                    (c) => c.parent_id === parent.id
                  );
                  if (children.length === 0) {
                    return (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.label_de}
                      </SelectItem>
                    );
                  }
                  return (
                    <SelectGroup key={parent.id}>
                      <SelectLabel>{parent.label_de}</SelectLabel>
                      <SelectItem value={parent.id}>
                        {parent.label_de} ({t("costumeForm.general")})
                      </SelectItem>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.label_de}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator />

      {/* === Eigenschaften (multi-select via toggle badges) === */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("costumeForm.properties")}</h2>

        <div className="flex flex-col gap-2">
          <Label>{t("costumeForm.material")}</Label>
          <div className="flex flex-wrap gap-2">
            {initialTaxonomy.materials.map((m) => (
              <Badge
                key={m.id}
                variant={form.material_ids.includes(m.id) ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleTerm("material_ids", m.id)}
              >
                {m.label_de}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("costumeForm.color")}</Label>
          <div className="flex flex-wrap gap-2">
            {initialTaxonomy.colors.map((c) => (
              <Badge
                key={c.id}
                variant={form.color_ids.includes(c.id) ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleTerm("color_ids", c.id)}
              >
                {c.label_de}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("costumeForm.epoch")}</Label>
          <div className="flex flex-wrap gap-2">
            {initialTaxonomy.epochs.map((ep) => (
              <Badge
                key={ep.id}
                variant={form.epoch_ids.includes(ep.id) ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleTerm("epoch_ids", ep.id)}
              >
                {ep.label_de}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* === Physisches Stück === */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("costumeForm.physicalItem")}</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="size_label">{t("costumeForm.sizeLabel")}</Label>
          <Input
            id="size_label"
            value={form.size_label}
            onChange={(e) => setForm((prev) => ({ ...prev, size_label: e.target.value }))}
            placeholder={t("costumeForm.sizePlaceholder")}
            className="max-w-xs"
          />
        </div>
      </section>

      <Separator />

      {/* === Herkunft === */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("costumeForm.provenance")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="production_title">{t("costumeForm.productionTitle")}</Label>
            <Input
              id="production_title"
              value={form.production_title}
              onChange={(e) => setForm((prev) => ({ ...prev, production_title: e.target.value }))}
              placeholder={t("costumeForm.productionTitlePlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="production_year">{t("costumeForm.year")}</Label>
            <Input
              id="production_year"
              type="number"
              value={form.production_year}
              onChange={(e) => setForm((prev) => ({ ...prev, production_year: e.target.value }))}
              placeholder={t("costumeForm.yearPlaceholder")}
              className="max-w-xs"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="role_name">{t("costumeForm.role")}</Label>
            <Input
              id="role_name"
              value={form.role_name}
              onChange={(e) => setForm((prev) => ({ ...prev, role_name: e.target.value }))}
              placeholder={t("costumeForm.rolePlaceholder")}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* === Foto === */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("costumeForm.photo")}</h2>
        {photoPreview ? (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt={t("costumeForm.photoPreview")}
              className="h-48 rounded-md object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-6 w-6"
              onClick={removePhoto}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-32 w-full max-w-xs cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-muted-foreground/50"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm">{t("costumeForm.uploadPhoto")}</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </section>

      <Separator />

      {/* === Submit === */}
      <div className="flex gap-3">
        <Button type="submit" disabled={createCostume.isPending || !form.name.trim()}>
          {createCostume.isPending ? t("costumeForm.saving") : t("costumeForm.saveCostume")}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/fundus">{t("common.cancel")}</Link>
        </Button>
      </div>

      {createCostume.isError && (
        <p className="text-sm text-destructive">
          {t("common.error")}: {(createCostume.error as Error).message}
        </p>
      )}
    </form>
  );
}
