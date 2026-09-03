"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CameraIcon, ChevronLeftIcon, CloseIcon, UploadIcon } from "@/components/icons";
import { withLocale } from "@/lib/i18n/href";
import type { Dictionary } from "@/app/[locale]/dictionaries";

const CANVAS_SIZE = 288;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_GALLERY_PHOTOS = 6;
const MAX_GALLERY_DIMENSION = 1280;

type GalleryPhoto = { id: string; position: number };

function resizeToBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_GALLERY_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.round(img.naturalWidth * scale);
      const height = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("no canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("toBlob failed"));
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

export default function PhotoManager({
  hasExistingPhoto,
  initialGalleryPhotos,
  standalone = false,
  dict,
}: {
  hasExistingPhoto: boolean;
  initialGalleryPhotos: GalleryPhoto[];
  // True in My Profile (Wasifu Wangu) — hides the wizard-only bottom nav bar,
  // since photo uploads already self-confirm inline with no "continue to
  // next step" concept outside onboarding.
  standalone?: boolean;
  dict: Dictionary["onboarding"];
}) {
  const t = dict.photo;
  const c = dict.common;
  const router = useRouter();
  const pathname = usePathname();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const addTileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const dragState = useRef<{ x: number; y: number } | null>(null);

  const [coverMode, setCoverMode] = useState<"done" | "choose" | "edit">(hasExistingPhoto ? "done" : "choose");
  const [photoSaved, setPhotoSaved] = useState(hasExistingPhoto);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>(initialGalleryPhotos);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  const maxOffset = useCallback(
    (currentZoom: number) => {
      const img = imageRef.current;
      if (!img) return { x: 0, y: 0 };
      const scaledW = img.naturalWidth * baseScale * currentZoom;
      const scaledH = img.naturalHeight * baseScale * currentZoom;
      return {
        x: Math.max(0, (scaledW - CANVAS_SIZE) / 2),
        y: Math.max(0, (scaledH - CANVAS_SIZE) / 2),
      };
    },
    [baseScale]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.save();
    ctx.translate(CANVAS_SIZE / 2 + offset.x, CANVAS_SIZE / 2 + offset.y);
    ctx.scale(baseScale * zoom, baseScale * zoom);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  }, [offset, zoom, baseScale]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function loadCoverFile(file: File) {
    setCoverError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setCoverError(t.invalidType);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setCoverError(t.tooLarge);
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      const scale = CANVAS_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
      setBaseScale(scale);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setCoverMode("edit");
    };
    img.onerror = () => setCoverError(t.loadFailed);
    img.src = url;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    dragState.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragState.current) return;
    const bound = maxOffset(zoom);
    const nextX = Math.min(bound.x, Math.max(-bound.x, e.clientX - dragState.current.x));
    const nextY = Math.min(bound.y, Math.max(-bound.y, e.clientY - dragState.current.y));
    setOffset({ x: nextX, y: nextY });
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  function handleZoomChange(value: number) {
    setZoom(value);
    const bound = maxOffset(value);
    setOffset((prev) => ({
      x: Math.min(bound.x, Math.max(-bound.x, prev.x)),
      y: Math.min(bound.y, Math.max(-bound.y, prev.y)),
    }));
  }

  function handleRetake() {
    setCoverMode("choose");
    setCoverError(null);
  }

  async function handleConfirmCover() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCoverLoading(true);
    setCoverError(null);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setCoverError(t.prepareFailed);
          setCoverLoading(false);
          return;
        }
        try {
          const formData = new FormData();
          formData.append("photo", blob, "profile.jpg");
          const res = await fetch("/api/onboarding/photo", { method: "POST", body: formData });
          const json = await res.json();
          if (!res.ok) {
            setCoverError(json.error ?? c.genericError);
            setCoverLoading(false);
            return;
          }
          setPhotoSaved(true);
          setCoverMode("done");
          setCoverLoading(false);
        } catch {
          setCoverError(c.networkError);
          setCoverLoading(false);
        }
      },
      "image/jpeg",
      0.85
    );
  }

  function handleContinue() {
    // Hard navigation: same reasoning as OtpForm/LoginForm — avoid any
    // reliance on the client Router Cache for a security-relevant
    // destination.
    window.location.href = withLocale(pathname ?? "/", "/wanachama");
  }

  async function handleAddGalleryFile(file: File) {
    setGalleryError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setGalleryError(t.invalidType);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setGalleryError(t.tooLarge);
      return;
    }

    setGalleryUploading(true);
    try {
      const blob = await resizeToBlob(file);
      const formData = new FormData();
      formData.append("photo", blob, "gallery.jpg");
      const res = await fetch("/api/profile-photos", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setGalleryError(json.error ?? c.genericError);
        return;
      }
      setGalleryPhotos((prev) => [...prev, { id: json.id, position: prev.length + 1 }]);
    } catch {
      setGalleryError(c.networkError);
    } finally {
      setGalleryUploading(false);
    }
  }

  async function handleDeleteGalleryPhoto(id: string) {
    setGalleryPhotos((prev) => prev.filter((p) => p.id !== id));
    try {
      const res = await fetch(`/api/profile-photos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      setGalleryError(t.deleteFailed);
      setGalleryPhotos(initialGalleryPhotos);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy">{t.pageHeading}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t.pageSubtitle}</p>
      </div>

      {coverMode === "choose" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-navy transition hover:bg-blush-50"
          >
            <CameraIcon className="h-5 w-5" /> {t.takePhoto}
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-navy transition hover:bg-blush-50"
          >
            <UploadIcon className="h-5 w-5" /> {t.uploadFromDevice}
          </button>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && loadCoverFile(e.target.files[0])}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && loadCoverFile(e.target.files[0])}
          />
          {coverError && <p className="text-sm text-red-600">{coverError}</p>}
        </div>
      )}

      {coverMode === "edit" && (
        <div className="space-y-3">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="cursor-grab touch-none rounded-full border border-black/10 shadow-sm active:cursor-grabbing"
            />
          </div>
          <p className="text-center text-xs text-neutral-500">{t.dragHint}</p>
          <input
            type="range"
            min={1}
            max={2.5}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRetake}
              className="flex-1 rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-blush-50"
            >
              {t.reset}
            </button>
            <button
              type="button"
              onClick={handleConfirmCover}
              disabled={coverLoading}
              className="flex-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
            >
              {coverLoading ? t.uploading : t.useThisPhoto}
            </button>
          </div>
          {coverError && <p className="text-sm text-red-600">{coverError}</p>}
        </div>
      )}

      {coverMode === "done" && (
        <div>
          <div className="grid grid-cols-3 gap-2">
            <div className="group relative aspect-square overflow-hidden rounded-xl border border-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route */}
              <img src="/api/onboarding/photo" alt="" className="h-full w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                {t.mainBadge}
              </span>
              <button
                type="button"
                onClick={() => setCoverMode("choose")}
                className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-xs font-semibold text-white transition hover:bg-black/75"
              >
                {t.change}
              </button>
            </div>

            {galleryPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-black/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route */}
                <img src={`/api/profile-photos/${photo.id}`} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteGalleryPhoto(photo.id)}
                  aria-label={t.deletePhotoAria}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {galleryPhotos.length < MAX_GALLERY_PHOTOS && (
              <button
                type="button"
                onClick={() => addTileInputRef.current?.click()}
                disabled={galleryUploading}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-black/15 text-neutral-400 transition hover:bg-blush-50 disabled:opacity-60"
              >
                <UploadIcon className="h-5 w-5" />
                <span className="text-xs font-medium">{galleryUploading ? t.uploading : t.addTile}</span>
              </button>
            )}
          </div>

          <input
            ref={addTileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleAddGalleryFile(e.target.files[0])}
          />

          <p className="mt-2 text-xs text-neutral-500">
            {t.galleryHint.replace("{maxGallery}", String(MAX_GALLERY_PHOTOS))}
          </p>
          {galleryError && <p className="mt-1 text-sm text-red-600">{galleryError}</p>}
        </div>
      )}

      {!standalone && (
        <div className="flex gap-3 border-t border-black/5 pt-4">
          <button
            type="button"
            onClick={() => router.push(withLocale(pathname ?? "/", "/onboarding/guardian"))}
            className="flex items-center gap-1.5 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-blush-50"
          >
            <ChevronLeftIcon className="h-4 w-4" /> {c.back}
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className={`flex-1 rounded-full px-6 py-3 text-sm font-semibold transition ${
              photoSaved
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            {photoSaved ? c.continue : t.skipForNow}
          </button>
        </div>
      )}
    </div>
  );
}
