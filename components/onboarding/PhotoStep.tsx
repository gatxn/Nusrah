"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, ChevronLeftIcon, UploadIcon } from "@/components/icons";

const CANVAS_SIZE = 288;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function PhotoStep({ hasExistingPhoto }: { hasExistingPhoto: boolean }) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const dragState = useRef<{ x: number; y: number } | null>(null);

  const [mode, setMode] = useState<"choose" | "edit">("choose");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function loadFile(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Chagua picha ya JPEG, PNG au WEBP");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Picha ni kubwa mno (kiwango cha juu ni 8MB)");
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
      setMode("edit");
    };
    img.onerror = () => setError("Imeshindwa kupakia picha. Jaribu tena.");
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
    setMode("choose");
    setError(null);
  }

  async function handleConfirm() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setLoading(true);
    setError(null);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setError("Imeshindwa kutayarisha picha. Jaribu tena.");
          setLoading(false);
          return;
        }
        try {
          const formData = new FormData();
          formData.append("photo", blob, "profile.jpg");
          const res = await fetch("/api/onboarding/photo", { method: "POST", body: formData });
          const json = await res.json();
          if (!res.ok) {
            setError(json.error ?? "Hitilafu imetokea");
            setLoading(false);
            return;
          }
          // Hard navigation: same reasoning as OtpForm/LoginForm — avoid any
          // reliance on the client Router Cache for a security-relevant
          // destination.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/wanachama";
        } catch {
          setError("Imeshindwa kuunganisha na seva. Jaribu tena.");
          setLoading(false);
        }
      },
      "image/jpeg",
      0.85
    );
  }

  function handleSkip() {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- see handleConfirm above
    window.location.href = "/wanachama";
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-navy">Weka Picha Yako</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Picha hii itaonekana hadharani na wanachama wengine wa Nusrah. Usiweke picha isiyo na
          heshima au ya mtu mwingine.
        </p>
      </div>

      {mode === "choose" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-navy transition hover:bg-blush-50"
          >
            <CameraIcon className="h-5 w-5" /> Piga Picha
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-navy transition hover:bg-blush-50"
          >
            <UploadIcon className="h-5 w-5" /> Pakia kutoka Kifaa
          </button>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
          />
        </div>
      )}

      {mode === "edit" && (
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
          <p className="text-center text-xs text-neutral-500">Buruta ili kuweka vizuri, tumia kitelezi kukuza</p>
          <input
            type="range"
            min={1}
            max={2.5}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <button
            type="button"
            onClick={handleRetake}
            className="w-full rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-blush-50"
          >
            Weka Upya
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.push("/onboarding/intentions")}
          className="flex items-center gap-1.5 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-blush-50"
        >
          <ChevronLeftIcon className="h-4 w-4" /> Rudi Nyuma
        </button>
        {mode === "edit" ? (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? "Inapakia..." : "Tumia Picha Hii"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 rounded-full bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20"
          >
            {hasExistingPhoto ? "Endelea" : "Ruka kwa Sasa"}
          </button>
        )}
      </div>
    </div>
  );
}
