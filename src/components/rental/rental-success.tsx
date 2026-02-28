"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { t } from "@/lib/i18n";

interface RentalSuccessProps {
  orderId: string;
}

export function RentalSuccess({ orderId }: RentalSuccessProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      {/* Green checkmark */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      {/* Success message */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">{t("rental.successTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("rental.rentalNumber")}: {orderId.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* CTA button */}
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
