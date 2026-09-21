"use client";

import { useEffect, useRef, useState } from "react";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { Dictionary } from "@/app/[locale]/dictionaries";

const AUTO_ADVANCE_MS = 5000;

// Nearly fills the screen on phones (the ask: "almost the whole screen
// space"); on lg+ this instead fills its parent column's height exactly,
// since MemberDetailCard switches to a side-by-side photo/details layout
// there and gives that column a fixed height itself.
const HEIGHT_CLASS = "h-[80vh] max-h-[720px] sm:h-[520px] lg:h-full lg:max-h-none";

type CarouselLabels = Pick<
  Dictionary["wanachama"]["card"],
  "onlineAria" | "previousPhotoAria" | "nextPhotoAria" | "photoNumberAria"
>;

export default function ProfilePhotoCarousel({
  userId,
  hasPhoto,
  name,
  extraPhotoIds,
  isOnline,
  labels,
}: {
  userId: string;
  hasPhoto: boolean;
  name: string;
  extraPhotoIds: string[];
  isOnline: boolean;
  labels: CarouselLabels;
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
    const wrapped = (index + slides.length) % slides.length;
    scroller.scrollTo({ left: wrapped * scroller.clientWidth, behavior: "smooth" });
    setActiveIndex(wrapped);
  }

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) return;
    setActiveIndex(Math.round(scroller.scrollLeft / scroller.clientWidth));
  }

  // Auto-advance every 5s while there's more than one photo. Restarts
  // whenever activeIndex changes, whether from this timer, a manual swipe,
  // or the chevron buttons — so a manual interaction doesn't get instantly
  // overridden by a timer that was already mid-countdown.
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setTimeout(() => scrollToIndex(activeIndex + 1), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scrollToIndex closes over slides.length, stable for a given profile
  }, [activeIndex, slides.length]);

  if (slides.length === 0) {
    return (
      <div className={`relative w-full ${HEIGHT_CLASS} bg-blush-50`}>
        <div className="flex h-full w-full items-center justify-center">
          <AvatarIllustration name={name} className="h-28 w-28" />
        </div>
        {isOnline && <OnlineBadge label={labels.onlineAria} />}
      </div>
    );
  }

  if (slides.length === 1) {
    return (
      <div className={`relative w-full ${HEIGHT_CLASS} bg-blush-50`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route */}
        <img src={slides[0]} alt="" className="h-full w-full object-contain" />
        {isOnline && <OnlineBadge label={labels.onlineAria} />}
      </div>
    );
  }

  return (
    <div className={`flex w-full flex-col ${HEIGHT_CLASS}`}>
      <div className="relative min-h-0 w-full flex-1 bg-blush-50">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
        >
          {slides.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route
            <img key={src} src={src} alt="" className="h-full w-full shrink-0 snap-start object-contain" />
          ))}
        </div>

        {isOnline && <OnlineBadge label={labels.onlineAria} />}

        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex - 1)}
          aria-label={labels.previousPhotoAria}
          className="absolute inset-y-0 start-2 my-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition hover:bg-white"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex + 1)}
          aria-label={labels.nextPhotoAria}
          className="absolute inset-y-0 end-2 my-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition hover:bg-white"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto bg-white p-2">
        {slides.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => scrollToIndex(i)}
            aria-label={labels.photoNumberAria.replace("{number}", String(i + 1))}
            aria-current={i === activeIndex}
            className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-16 sm:w-16 ${
              i === activeIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function OnlineBadge({ label }: { label: string }) {
  return (
    <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-green-700 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-green-500" /> {label}
    </span>
  );
}
