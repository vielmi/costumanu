"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ShoppingCart,
  Heart,
  ScanLine,
  PenLine,
  User,
  MapPin,
  Mail,
  Phone,
  Trash2,
  Calendar,
} from "lucide-react";
import { t } from "@/lib/i18n";

// ─── Types ───────────────────────────────────────────────────────────

interface CostumeData {
  id: string;
  name: string;
  theater_id: string;
  costume_media: { id: string; storage_path: string; sort_order: number }[];
  costume_provenance: { production_title: string; year: number | null }[];
  costume_items: { barcode_id: string }[];
  theater: { id: string; name: string; slug: string } | null;
}

interface CartItem {
  id: string;
  costume_id: string;
  added_at: string;
  costumes: CostumeData;
}

interface UserProfile {
  display_name: string;
  professional_title: string | null;
  phone: string | null;
}

interface RentalWizardProps {
  userId: string;
  userEmail: string;
  theaterId: string;
  theaterName: string;
  profile: UserProfile;
  initialCartItems: CartItem[];
}

type CostumeSource = "cart" | "wishlist" | "scan" | "manual";

const STEPS = [
  { key: "personalien", labelKey: "rental.step1Title" },
  { key: "auswahl", labelKey: "rental.step2Title" },
  { key: "zusammenfassung", labelKey: "rental.step3Title" },
] as const;

// ─── Component ───────────────────────────────────────────────────────

export function RentalWizard({
  userId,
  userEmail,
  theaterId,
  theaterName,
  profile,
  initialCartItems,
}: RentalWizardProps) {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [costumeSource, setCostumeSource] = useState<CostumeSource>("cart");
  const [selectedCostumes, setSelectedCostumes] = useState<CartItem[]>(
    initialCartItems
  );
  const [isSuccess, setIsSuccess] = useState(false);

  // Cart items via React Query
  const { data: cartItems } = useQuery({
    queryKey: ["cart-items", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          costume_id,
          added_at,
          costumes:costume_id (
            id,
            name,
            theater_id,
            costume_media (id, storage_path, sort_order),
            costume_provenance (production_title, year),
            costume_items (barcode_id),
            theater:theater_id (id, name, slug)
          )
        `
        )
        .eq("user_id", userId)
        .order("added_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CartItem[];
    },
    initialData: initialCartItems,
  });

  // Create rental order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const { data: order, error: orderError } = await supabase
        .from("rental_orders")
        .insert({
          lender_theater_id: theaterId,
          borrower_theater_id: theaterId,
          borrower_user_id: userId,
          status: "requested",
          production_context: purpose || null,
          rental_period:
            startDate && endDate ? `[${startDate},${endDate}]` : null,
        })
        .select("id")
        .single();

      if (orderError) throw orderError;
      return order;
    },
    onSuccess: () => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["cart-items", userId] });
    },
  });

  // Remove a costume from the selection
  function handleRemoveCostume(cartItemId: string) {
    setSelectedCostumes((prev) => prev.filter((c) => c.id !== cartItemId));
  }

  // ─── Success screen ─────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">{t("rental.successTitle")}</h1>
        </div>

        <Button
          className="bg-gold text-gold-foreground hover:bg-gold/90"
          size="lg"
          onClick={() => router.push("/")}
        >
          {t("rental.toHomepage")}
        </Button>
      </div>
    );
  }

  // ─── Navigation handlers ───────────────────────────────────────────

  function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }

  function handleSubmit() {
    createOrderMutation.mutate();
  }

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step 1: Personalien */}
      {currentStep === 0 && (
        <Step1Personalien
          profile={profile}
          userEmail={userEmail}
          theaterName={theaterName}
          purpose={purpose}
          setPurpose={setPurpose}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onNext={handleNext}
        />
      )}

      {/* Step 2: Auswahl */}
      {currentStep === 1 && (
        <Step2Auswahl
          cartItems={cartItems}
          selectedCostumes={selectedCostumes}
          costumeSource={costumeSource}
          setCostumeSource={setCostumeSource}
          onRemoveCostume={handleRemoveCostume}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}

      {/* Step 3: Zusammenfassung */}
      {currentStep === 2 && (
        <Step3Zusammenfassung
          profile={profile}
          userEmail={userEmail}
          theaterName={theaterName}
          purpose={purpose}
          startDate={startDate}
          endDate={endDate}
          selectedCostumes={selectedCostumes}
          onPrevious={handlePrevious}
          onSubmit={handleSubmit}
          isSubmitting={createOrderMutation.isPending}
          error={createOrderMutation.error}
        />
      )}
    </div>
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isCompleted
                    ? "bg-gold text-gold-foreground"
                    : isActive
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs ${
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {t(step.labelKey)}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 ${
                  isCompleted ? "bg-gold" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Personalien ─────────────────────────────────────────────

function Step1Personalien({
  profile,
  userEmail,
  theaterName,
  purpose,
  setPurpose,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onNext,
}: {
  profile: UserProfile;
  userEmail: string;
  theaterName: string;
  purpose: string;
  setPurpose: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold">{t("rental.step1Title")}</h2>

      {/* User info card */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4">
          <h3 className="text-sm font-semibold">{t("rental.myDetails")}</h3>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {profile.display_name || "---"}
              </span>
              {profile.professional_title && (
                <span className="text-xs text-muted-foreground">
                  {profile.professional_title}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{theaterName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span>{userEmail}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{profile.phone}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Purpose */}
      <div className="flex flex-col gap-2">
        <label htmlFor="purpose" className="text-sm font-medium">
          {t("rental.purpose")}
        </label>
        <Input
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="z.B. Produktion Romeo & Julia, Stadttheater Bern"
        />
      </div>

      {/* Rental period */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("rental.rentalPeriod")}</span>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label
              htmlFor="startDate"
              className="text-xs text-muted-foreground"
            >
              {t("rental.startDate")}
            </label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="endDate" className="text-xs text-muted-foreground">
              {t("rental.endDate")}
            </label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Next button */}
      <Button
        className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
        size="lg"
        onClick={onNext}
      >
        {t("rental.nextStep")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Step 2: Auswahl ─────────────────────────────────────────────────

const COSTUME_SOURCES: {
  key: CostumeSource;
  labelKey: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "cart",
    labelKey: "rental.fromCart",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    key: "wishlist",
    labelKey: "rental.fromWishlist",
    icon: <Heart className="h-5 w-5" />,
  },
  {
    key: "scan",
    labelKey: "rental.scanLabels",
    icon: <ScanLine className="h-5 w-5" />,
  },
  {
    key: "manual",
    labelKey: "rental.manualEntry",
    icon: <PenLine className="h-5 w-5" />,
  },
];

function Step2Auswahl({
  selectedCostumes,
  costumeSource,
  setCostumeSource,
  onRemoveCostume,
  onNext,
  onPrevious,
}: {
  selectedCostumes: CartItem[];
  costumeSource: CostumeSource;
  setCostumeSource: (v: CostumeSource) => void;
  onRemoveCostume: (id: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold">{t("rental.step2Title")}</h2>

      {/* Selected costumes list */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">
          {t("rental.selectedCostumes")}{" "}
          <Badge variant="secondary" className="ml-1">
            {selectedCostumes.length}
          </Badge>
        </h3>

        {selectedCostumes.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {t("rental.chooseCostumes")}
            </CardContent>
          </Card>
        ) : (
          selectedCostumes.map((item) => (
            <CostumeCard
              key={item.id}
              item={item}
              onRemove={() => onRemoveCostume(item.id)}
            />
          ))
        )}
      </div>

      {/* Source selection */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">{t("rental.costumeSource")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("rental.chooseSource")}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {COSTUME_SOURCES.map((source) => {
            const isSelected = costumeSource === source.key;

            return (
              <button
                key={source.key}
                type="button"
                onClick={() => setCostumeSource(source.key)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                  isSelected
                    ? "border-foreground bg-accent"
                    : "border-border hover:bg-accent/50"
                }`}
              >
                <div
                  className={`${
                    isSelected
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {source.icon}
                </div>
                <span className="text-xs font-medium">{t(source.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onPrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("rental.previousStep")}
        </Button>
        <Button
          className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90"
          onClick={onNext}
        >
          {t("rental.nextStep")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Costume Card (used in Step 2) ───────────────────────────────────

function CostumeCard({
  item,
  onRemove,
}: {
  item: CartItem;
  onRemove: () => void;
}) {
  const supabase = createClient();
  const costume = item.costumes;
  const firstMedia = costume.costume_media?.[0];
  const firstProvenance = costume.costume_provenance?.[0];
  const firstItem = costume.costume_items?.[0];

  const imageUrl = firstMedia
    ? supabase.storage.from("costume-images").getPublicUrl(firstMedia.storage_path).data.publicUrl
    : null;

  return (
    <Card className="py-3">
      <CardContent className="flex items-center gap-4">
        {/* Thumbnail */}
        <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={costume.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10 text-[10px] text-muted-foreground">
              Kein Foto
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {firstItem && (
            <span className="font-mono text-xs text-muted-foreground">
              {firstItem.barcode_id}
            </span>
          )}
          <h3 className="truncate text-sm font-semibold">{costume.name}</h3>
          {firstProvenance && (
            <p className="truncate text-xs text-muted-foreground">
              {firstProvenance.production_title}
              {firstProvenance.year ? ` (${firstProvenance.year})` : ""}
            </p>
          )}
          {costume.theater && (
            <Badge variant="secondary" className="mt-0.5 w-fit gap-1 text-[10px]">
              <MapPin className="h-2.5 w-2.5" />
              {costume.theater.name}
            </Badge>
          )}
        </div>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label="Entfernen"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Step 3: Zusammenfassung ─────────────────────────────────────────

function Step3Zusammenfassung({
  profile,
  userEmail,
  theaterName,
  purpose,
  startDate,
  endDate,
  selectedCostumes,
  onPrevious,
  onSubmit,
  isSubmitting,
  error,
}: {
  profile: UserProfile;
  userEmail: string;
  theaterName: string;
  purpose: string;
  startDate: string;
  endDate: string;
  selectedCostumes: CartItem[];
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: Error | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold">{t("rental.summaryTitle")}</h2>

      {/* User info summary */}
      <Card>
        <CardContent className="flex flex-col gap-2 pt-4">
          <h3 className="text-sm font-semibold">{t("rental.userInfo")}</h3>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span>{profile.display_name}</span>
            {profile.professional_title && (
              <span>{profile.professional_title}</span>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{theaterName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 shrink-0" />
              <span>{userEmail}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{profile.phone}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Purpose */}
      {purpose && (
        <Card>
          <CardContent className="flex flex-col gap-1 pt-4">
            <h3 className="text-sm font-semibold">{t("rental.purpose")}</h3>
            <p className="text-sm text-muted-foreground">{purpose}</p>
          </CardContent>
        </Card>
      )}

      {/* Rental period */}
      {(startDate || endDate) && (
        <Card>
          <CardContent className="flex flex-col gap-1 pt-4">
            <h3 className="text-sm font-semibold">
              {t("rental.rentalPeriod")}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>
                {startDate
                  ? new Date(startDate).toLocaleDateString("de-DE")
                  : "---"}{" "}
                &ndash;{" "}
                {endDate
                  ? new Date(endDate).toLocaleDateString("de-DE")
                  : "---"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected costumes */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">
          {t("rental.selectedCostumes")}{" "}
          <Badge variant="secondary" className="ml-1">
            {selectedCostumes.length}
          </Badge>
        </h3>
        {selectedCostumes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("rental.chooseCostumes")}
          </p>
        ) : (
          selectedCostumes.map((item) => (
            <SummaryCostumeCard key={item.id} item={item} />
          ))
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">
          {t("common.error")}: {error.message}
        </p>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onPrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("rental.previousStep")}
        </Button>
        <Button
          className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90"
          size="lg"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {t("rental.createRentalOrder")}
        </Button>
      </div>
    </div>
  );
}

// ─── Summary Costume Card (read-only, used in Step 3) ────────────────

function SummaryCostumeCard({ item }: { item: CartItem }) {
  const supabase = createClient();
  const costume = item.costumes;
  const firstMedia = costume.costume_media?.[0];
  const firstProvenance = costume.costume_provenance?.[0];
  const firstItem = costume.costume_items?.[0];

  const imageUrl = firstMedia
    ? supabase.storage.from("costume-images").getPublicUrl(firstMedia.storage_path).data.publicUrl
    : null;

  return (
    <Card className="py-2">
      <CardContent className="flex items-center gap-3">
        {/* Thumbnail */}
        <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={costume.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10 text-[8px] text-muted-foreground">
              Foto
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{costume.name}</span>
          {firstItem && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {firstItem.barcode_id}
            </span>
          )}
          {firstProvenance && (
            <span className="truncate text-xs text-muted-foreground">
              {firstProvenance.production_title}
            </span>
          )}
        </div>

        {/* Theater badge */}
        {costume.theater && (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {costume.theater.name}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
