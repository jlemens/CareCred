"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { getCroppedImageBlob } from "@/lib/crop-image";

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onApply: (file: File) => void | Promise<void>;
};

export function AvatarCropModal({ imageSrc, onCancel, onApply }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setPixels(croppedAreaPixels);
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function apply() {
    if (!pixels) {
      setError("Still loading crop — try again in a moment.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blob = await getCroppedImageBlob(imageSrc, pixels);
      const file = new File([blob], "profile-photo.jpg", {
        type: "image/jpeg",
      });
      await onApply(file);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not apply crop. Try another photo.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-crop-title"
    >
      <div className="card flex max-h-[min(100dvh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-b-none rounded-t-2xl shadow-xl sm:max-h-[90dvh] sm:rounded-2xl">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <h2 id="avatar-crop-title" className="text-base font-semibold">
            Position your photo
          </h2>
          <p className="mt-1 text-xs text-muted">
            Drag to frame your photo. Pinch or use the slider to zoom. Banner-style
            images with text at the bottom stay fully visible while you crop.
          </p>
        </div>

        <div className="relative min-h-[320px] w-full flex-1 overflow-hidden bg-[#0a0d14] sm:min-h-[380px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            objectFit="contain"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-3 border-t border-border p-4 sm:p-5">
          <label className="flex items-center gap-3 text-sm">
            <span className="w-12 shrink-0 text-muted">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="min-h-11 flex-1 accent-[var(--accent-primary)]"
            />
          </label>
          {error ? (
            <p className="text-xs text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="min-h-11 flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-alt disabled:opacity-50 sm:flex-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void apply()}
              disabled={busy}
              className="min-h-11 flex-1 rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50 sm:flex-none"
            >
              {busy ? "Working…" : "Use this crop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
