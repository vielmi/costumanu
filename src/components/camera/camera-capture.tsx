"use client";

import { useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      } catch {
        setError("Kamera konnte nicht gestartet werden.");
      }
    }
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  function handleCapture() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" });
      streamRef.current?.getTracks().forEach(t => t.stop());
      onCapture(file);
    }, "image/jpeg", 0.92);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.95)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 20, right: 20,
          background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
          width: 44, height: 44, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <img src="/icons/icon-close-small.svg" alt="Schliessen" width={20} height={20} style={{ filter: "invert(1)" }} />
      </button>

      {error ? (
        <p style={{ color: "var(--color-error)", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-300)", textAlign: "center", padding: "0 32px" }}>
          {error}
        </p>
      ) : (
        <>
          <div style={{ position: "relative", width: "min(400px, 95vw)", borderRadius: 16, overflow: "hidden" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", display: "block" }}
            />
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {ready && (
            <button
              onClick={handleCapture}
              style={{
                marginTop: 32,
                width: 72, height: 72, borderRadius: "50%",
                background: "#FFFFFF", border: "4px solid rgba(255,255,255,0.4)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FFFFFF", border: "3px solid #000" }} />
            </button>
          )}

          <p style={{ marginTop: 16, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-family-base)", fontSize: "var(--font-size-200)" }}>
            Auslöser drücken zum Aufnehmen
          </p>
        </>
      )}
    </div>
  );
}
