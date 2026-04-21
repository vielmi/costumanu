"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarcodeScanner } from "@/components/barcode/barcode-scanner";

export default function ScanPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  const handleDetected = useCallback(async (code: string) => {
    setScanning(false);
    setError(null);

    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("costume_items")
      .select("costume_id")
      .eq("barcode_id", code)
      .single();

    if (dbError || !data) {
      setError(`Kein Kostüm mit Barcode „${code}" gefunden.`);
      return;
    }

    router.push(`/costume/${data.costume_id}`);
  }, [router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  if (error) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.92)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24,
      }}>
        <p style={{
          color: "var(--color-error)", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)",
          textAlign: "center", padding: "0 32px", maxWidth: 340,
        }}>
          {error}
        </p>
        <button
          onClick={() => { setError(null); setScanning(true); }}
          style={{
            background: "var(--primary-900)", border: "none", borderRadius: 12,
            padding: "12px 28px", color: "var(--neutral-black)", fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-250)", fontWeight: "var(--font-weight-500)", cursor: "pointer",
          }}
        >
          Erneut scannen
        </button>
        <button
          onClick={handleClose}
          style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.6)",
            fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)", cursor: "pointer",
          }}
        >
          Abbrechen
        </button>
      </div>
    );
  }

  if (!scanning) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <p style={{ color: "var(--neutral-white)", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)" }}>
          Kostüm wird gesucht…
        </p>
      </div>
    );
  }

  return <BarcodeScanner onDetected={handleDetected} onClose={handleClose} />;
}
