"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";

type Burst = { id: number; x: number; y: number; glyph: string };
const BURST_GLYPHS = ["💗", "✨", "💕"];

const CLUSTER_NAMES = ["Amina", "Yusuf", "Fatuma"];

const SLIDE_IMAGES = [
  "/images/hero-slide-1.jpg",
  "/images/hero-slide-2.jpg",
  "/images/hero-slide-3.jpg",
  "/images/hero-slide-4.jpg",
  "/images/hero-slide-5.jpg",
];
const SLIDE_INTERVAL_MS = 5000;

/**
 * Interactive hero visual: the background photo sits blurred/dimmed behind
 * an arch-shaped frame, the front photo sits inside it with a cursor-driven
 * 3D tilt, and a tap/click anywhere on the card spawns a small heart/sparkle
 * burst at that point. All effects are skipped under prefers-reduced-motion
 * (the tilt transform simply never gets set, and CSS neutralizes the burst
 * animation — see .hero-burst in globals.css).
 */
export default function HeroVisual({
  photoAlt,
  trustBadgeTitle,
  trustBadgeSubtitle,
}: {
  photoAlt: string;
  trustBadgeTitle: string;
  trustBadgeSubtitle: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const nextId = useRef(0);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      setActiveSlide((i) => (i + 1) % SLIDE_IMAGES.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    frame.style.transition = "transform 0.08s linear";
    frame.style.transform = `perspective(900px) rotateX(${relY * -12}deg) rotateY(${relX * 14}deg) scale3d(1.02,1.02,1.02)`;
  }

  function resetTilt() {
    const frame = frameRef.current;
    if (!frame) return;
    frame.style.transition = "transform 0.5s cubic-bezier(0.22,1,0.36,1)";
    frame.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const container = e.currentTarget.getBoundingClientRect();
    const glyph = BURST_GLYPHS[Math.floor(Math.random() * BURST_GLYPHS.length)];
    const id = nextId.current++;
    setBursts((prev) => [
      ...prev,
      { id, x: e.clientX - container.left, y: e.clientY - container.top, glyph },
    ]);
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 900);
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        className="relative h-[460px] cursor-pointer select-none overflow-hidden shadow-[0_30px_70px_rgba(88,40,90,0.18)]"
        style={{ borderRadius: "220px 220px 26px 26px" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        onClick={handleClick}
      >
        {/* Glowing background photo, blurred + dimmed backdrop */}
        <Image
          src="/images/hero-bg.jpg"
          alt=""
          aria-hidden="true"
          fill
          sizes="450px"
          className="scale-110 object-cover object-center blur-[3px] brightness-[0.55] saturate-[1.15]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/55 via-navy/35 to-navy/25" />

        {/* Front photo, tilts toward the cursor — crossfades through
            SLIDE_IMAGES every 5s (paused entirely under prefers-reduced-motion,
            see the effect above, so this never animates for those users). */}
        <div
          ref={frameRef}
          className="absolute inset-6 overflow-hidden shadow-2xl will-change-transform"
          style={{ borderRadius: "180px 180px 20px 20px" }}
        >
          {SLIDE_IMAGES.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={i === activeSlide ? photoAlt : ""}
              aria-hidden={i === activeSlide ? undefined : true}
              fill
              priority
              sizes="400px"
              className={`object-cover object-top transition-opacity duration-1000 ease-in-out ${
                i === activeSlide ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          {/* Gold frame line, painted as an overlay so it stays above the
              crossfading photos instead of being hidden beneath them. */}
          <div
            className="pointer-events-none absolute inset-0 ring-[3px] ring-inset ring-gold"
            style={{ borderRadius: "180px 180px 20px 20px" }}
          />
        </div>

        {/* Click/tap heart bursts */}
        {bursts.map((b) => (
          <span
            key={b.id}
            className="hero-burst pointer-events-none absolute text-2xl"
            style={{ left: b.x, top: b.y }}
          >
            {b.glyph}
          </span>
        ))}
      </div>

      {/* Members trust-badge cluster */}
      <div className="absolute bottom-8 end-2.5 flex items-center gap-3.5 rounded-2xl bg-white/95 py-3 ps-3.5 pe-5 shadow-[0_16px_36px_rgba(88,40,90,0.16)] backdrop-blur-sm">
        <div className="flex items-center">
          {CLUSTER_NAMES.map((name, i) => (
            <AvatarIllustration
              key={name}
              name={name}
              className={`h-8.5 w-8.5 rounded-full border-2 border-white ${i > 0 ? "-ms-3" : ""}`}
            />
          ))}
          <span className="-ms-3 flex h-8.5 items-center rounded-full border-2 border-white bg-primary-dark px-2.5 text-[11.5px] font-semibold text-white">
            35K+
          </span>
        </div>
        <div>
          <p className="font-heading text-[15px] font-semibold leading-tight text-navy">{trustBadgeTitle}</p>
          <p className="text-[12.5px] text-muted">{trustBadgeSubtitle}</p>
        </div>
      </div>
    </div>
  );
}
