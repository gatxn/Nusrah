"use client";

import { useRef, useState } from "react";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export default function ProfilePhotoCarousel({
  userId,
  hasPhoto,
  name,
  extraPhotoIds,
  isOnline,
}: {
  userId: string;
  hasPhoto: boolean;
  name: string;
  extraPhotoIds: string[];
  isOnline: boolean;
}) {
  const slides = [
    ...(hasPhoto ? [`/api/profiles/${userId}/photo`] : []),
    ...extraPhotoIds.map((id) => `/api/profiles/${userId}/photos/${id}`),
  ];
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function scrollToIndex(index: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ left: index * scroller.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
  }

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) return;
    setActiveIndex(Math.round(scroller.scrollLeft / scroller.clientWidth));
  }

  if (slides.length === 0) {
    return (
      <div className="relative h-72 w-full bg-blush-50">
        <div className="flex h-full w-full items-center justify-center">
          <AvatarIllustration name={name} className="h-28 w-28" />
        </div>
        {isOnline && <OnlineBadge />}
      </div>
    );
  }

  if (slides.length === 1) {
    return (
      <div className="relative h-72 w-full bg-blush-50">
        {/* eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route */}
        <img src={slides[0]} alt="" className="h-full w-full object-cover" />
        {isOnline && <OnlineBadge />}
      </div>
    );
  }

  return (
    <div className="relative h-72 w-full bg-blush-50">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {slides.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route
          <img key={src} src={src} alt="" className="h-full w-full shrink-0 snap-start object-cover" />
        ))}
      </div>

      {isOnline && <OnlineBadge />}

      <button
        type="button"
        onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
        aria-label="Picha iliyopita"
        className="absolute inset-y-0 start-2 my-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition hover:bg-white disabled:opacity-0"
        disabled={activeIndex === 0}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollToIndex(Math.min(slides.length - 1, activeIndex + 1))}
        aria-label="Picha inayofuata"
        className="absolute inset-y-0 end-2 my-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition hover:bg-white disabled:opacity-0"
        disabled={activeIndex === slides.length - 1}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>

      <div className="absolute bottom-3 start-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((src, i) => (
          <span
            key={src}
            className={`h-1.5 rounded-full transition-all ${
              i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function OnlineBadge() {
  return (
    <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-green-700 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-green-500" /> Mtandaoni
    </span>
  );
}
