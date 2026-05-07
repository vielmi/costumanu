"use client";

import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

// ─── Native (Capacitor) ──────────────────────────────────────────────────────

async function scanNative(onDetected: (code: string) => void) {
  const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");

  await BarcodeScanner.requestPermissions();
  await BarcodeScanner.addListener("barcodesScanned", (event) => {
    const raw = event.barcodes?.[0]?.rawValue;
    if (raw) {
      BarcodeScanner.stopScan();
      BarcodeScanner.removeAllListeners();
      onDetected(raw);
    }
  });
  await BarcodeScanner.startScan();
}

// ─── Web (@zxing/browser) ────────────────────────────────────────────────────

function WebScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState("Kamera wird gestartet…");

  useEffect(() => {
    let stopped = false;
    let controls: { stop: () => void } | null = null;

    async function start() {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        // Prefer back camera on mobile
        const device =
          devices.find((d) => /back|rear|environment/i.test(d.label)) ??
          devices[devices.length - 1];

        if (!device) {
          setError("Keine Kamera gefunden.");
          return;
        }

        setHint("Barcode/QR-Code in den Rahmen halten");

        controls = await reader.decodeFromVideoDevice(
          device.deviceId,
          videoRef.current!,
          (result) => {
            if (stopped) return;
            if (result) {
              stopped = true;
              controls?.stop();
              onDetected(result.getText());
            }
          }
        );
      } catch (e: unknown) {
        setError("Kamera konnte nicht gestartet werden: " + (e instanceof Error ? e.message : String(e)));
      }
    }

    start();
    const video = videoRef.current;
    return () => {
      stopped = true;
      controls?.stop();
      // Release camera stream so browser tab indicator disappears
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        video.srcObject = null;
      }
    };
  }, [onDetected]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.92)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 20, right: 20,
          background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
          width: 44, height: 44, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-close-small.svg" alt="Schliessen" width={20} height={20} style={{ filter: "invert(1)" }} />
      </button>

      {error ? (
        <p style={{ color: "var(--color-error)", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)", textAlign: "center", padding: "0 32px" }}>
          {error}
        </p>
      ) : (
        <>
          {/* Video */}
          <div style={{ position: "relative", width: "min(340px, 90vw)", aspectRatio: "1" }}>
            <video
              ref={videoRef}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
            />
            {/* Scan frame overlay */}
            <div style={{
              position: "absolute", inset: 0,
              border: "3px solid var(--primary-900)",
              borderRadius: 16,
              boxShadow: `0 0 0 9999px var(--overlay-scrim)`,
            }} />
          </div>

          <p style={{
            marginTop: 24, color: "rgba(255,255,255,0.7)",
            fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-250)", textAlign: "center",
          }}>
            {hint}
          </p>
        </>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const [isNative, setIsNative] = useState<boolean | null>(null);

  useEffect(() => {
    import("@capacitor/core").then(({ Capacitor }) => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);
      if (native) {
        scanNative(onDetected);
      }
    });
  }, [onDetected, onClose]);

  // Native: Capacitor handles its own UI — show minimal overlay with close button
  if (isNative === true) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
        <button
          onClick={async () => {
            const { BarcodeScanner: BS } = await import("@capacitor-mlkit/barcode-scanning");
            BS.stopScan();
            BS.removeAllListeners();
            onClose();
          }}
          style={{
            position: "absolute", top: 20, right: 20,
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
            width: 44, height: 44, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-close-small.svg" alt="Schliessen" width={20} height={20} style={{ filter: "invert(1)" }} />
        </button>
      </div>
    );
  }

  // Web: show inline scanner
  if (isNative === false) {
    return <WebScanner onDetected={onDetected} onClose={onClose} />;
  }

  // Loading — detecting platform
  return null;
}
