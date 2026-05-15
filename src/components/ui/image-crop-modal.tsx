"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface ImageCropModalProps {
  file: File;
  onConfirm: (cropped: File) => void;
  onSkip: () => void;
  onCancel: () => void;
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.92
    );
  });
}

export function ImageCropModal({ file, onConfirm, onSkip, onCancel }: ImageCropModalProps) {
  const imageSrc = URL.createObjectURL(file);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setWorking(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const croppedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
      });
      onConfirm(croppedFile);
    } finally {
      setWorking(false);
      URL.revokeObjectURL(imageSrc);
    }
  }

  function handleSkip() {
    URL.revokeObjectURL(imageSrc);
    onSkip();
  }

  function handleCancel() {
    URL.revokeObjectURL(imageSrc);
    onCancel();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 4000,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Header */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px 12px",
          color: "var(--neutral-white)",
          fontFamily: "var(--font-family-base)",
        }}
      >
        <span style={{ fontSize: "var(--font-size-300)", fontWeight: 600 }}>Bild zuschneiden</span>
        <span style={{ fontSize: "var(--font-size-150)", color: "rgba(255,255,255,0.6)" }}>
          Format 2:3
        </span>
      </div>

      {/* Crop area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          height: 420,
          background: "#111",
        }}
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={2 / 3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={false}
          style={{
            containerStyle: { borderRadius: 0 },
            cropAreaStyle: { borderRadius: 4 },
          }}
        />
      </div>

      {/* Zoom slider */}
      <div style={{ width: "100%", maxWidth: 480, padding: "14px 24px 0" }}>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--primary-900)" }}
          aria-label="Zoom"
        />
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "16px 16px 0",
          width: "100%",
          maxWidth: 480,
        }}
      >
        <button
          type="button"
          onClick={handleCancel}
          style={{
            flex: 1,
            height: 48,
            borderRadius: "var(--radius-md)",
            border: "1.5px solid rgba(255,255,255,0.3)",
            background: "transparent",
            color: "var(--neutral-white)",
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-200)",
            cursor: "pointer",
          }}
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={handleSkip}
          style={{
            flex: 1,
            height: 48,
            borderRadius: "var(--radius-md)",
            border: "1.5px solid rgba(255,255,255,0.3)",
            background: "transparent",
            color: "rgba(255,255,255,0.7)",
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-200)",
            cursor: "pointer",
          }}
        >
          Überspringen
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={working}
          style={{
            flex: 2,
            height: 48,
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "var(--primary-900)",
            color: "var(--neutral-white)",
            fontFamily: "var(--font-family-base)",
            fontSize: "var(--font-size-200)",
            fontWeight: 600,
            cursor: working ? "not-allowed" : "pointer",
            opacity: working ? 0.7 : 1,
          }}
        >
          {working ? "…" : "Zuschneiden"}
        </button>
      </div>
    </div>
  );
}
