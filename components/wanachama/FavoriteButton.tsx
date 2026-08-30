"use client";

import { useState } from "react";
import { HeartOutlineIcon, HeartFilledIcon } from "@/components/icons";

export default function FavoriteButton({
  favoritedUserId,
  initialFavorited,
  className = "",
}: {
  favoritedUserId: string;
  initialFavorited: boolean;
  className?: string;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

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
      if (!res.ok) setFavorited(!next); // revert on failure
    } catch {
      setFavorited(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorited}
      aria-label={favorited ? "Ondoa kwenye wanaopendwa" : "Ongeza kwenye wanaopendwa"}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm transition hover:bg-white ${
        favorited ? "scale-110" : ""
      } ${className}`}
    >
      {favorited ? (
        <HeartFilledIcon className="h-5 w-5 text-primary" />
      ) : (
        <HeartOutlineIcon className="h-5 w-5" />
      )}
    </button>
  );
}
