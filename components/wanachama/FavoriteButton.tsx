"use client";

import { useEffect, useRef, useState } from "react";
import { HeartOutlineIcon, HeartFilledIcon } from "@/components/icons";
import LocaleLink from "@/components/LocaleLink";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function FavoriteButton({
  favoritedUserId,
  initialFavorited,
  className = "",
  labels,
}: {
  favoritedUserId: string;
  initialFavorited: boolean;
  className?: string;
  labels: Pick<
    Dictionary["wanachama"]["card"],
    "addFavoriteAria" | "removeFavoriteAria" | "likeLimitReachedShort" | "likeLimitUpgrade"
  >;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const limitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (limitTimeoutRef.current) clearTimeout(limitTimeoutRef.current);
    };
  }, []);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    const next = !favorited;
    setFavorited(next); // optimistic
    setPending(true);

    try {
      const res = await fetch(`/api/favorites${next ? "" : `/${favoritedUserId}`}`, {
        method: next ? "POST" : "DELETE",
        headers: next ? { "Content-Type": "application/json" } : undefined,
        body: next ? JSON.stringify({ favoritedUserId }) : undefined,
      });
      if (!res.ok) {
        setFavorited(!next); // revert on failure
        if (next && res.status === 403) {
          setLimitReached(true);
          if (limitTimeoutRef.current) clearTimeout(limitTimeoutRef.current);
          limitTimeoutRef.current = setTimeout(() => setLimitReached(false), 4000);
        }
      }
    } catch {
      setFavorited(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    // The caller's className is expected to carry a position utility
    // (e.g. "absolute right-3 top-3" to overlay a photo). Falling back to
    // "relative" only when none is given avoids stacking a conflicting
    // "relative" + "absolute" pair on the same element — Tailwind's cascade
    // order isn't guaranteed to make the later class in the string win, so
    // this must never both be applied at once.
    <div className={`inline-block ${className || "relative"}`}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={favorited}
        aria-label={favorited ? labels.removeFavoriteAria : labels.addFavoriteAria}
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm transition hover:bg-white ${
          favorited ? "scale-110" : ""
        }`}
      >
        {favorited ? (
          <HeartFilledIcon className="h-5 w-5 text-primary" />
        ) : (
          <HeartOutlineIcon className="h-5 w-5" />
        )}
      </button>
      {limitReached && (
        <div className="absolute right-0 top-full z-10 mt-1.5 w-36 rounded-lg bg-navy px-2.5 py-2 text-center shadow-lg">
          <p className="text-[11px] font-medium text-white">{labels.likeLimitReachedShort}</p>
          <LocaleLink
            href="/boresha-kifurushi"
            className="mt-1 block text-[11px] font-semibold text-primary-light underline"
          >
            {labels.likeLimitUpgrade}
          </LocaleLink>
        </div>
      )}
    </div>
  );
}
