"use client";

import { useEffect, useRef, useState } from "react";
import MemberDetailCard from "@/components/wanachama/MemberDetailCard";
import type { SerializedProfile } from "@/lib/profiles";
import type { Tier } from "@/lib/tiers";
import type { Dictionary } from "@/app/[locale]/dictionaries";

type CardEntry = {
  profile: SerializedProfile;
  galleryPhotoIds?: string[];
  favorited: boolean;
};

export default function ProfileFeed({
  initialProfile,
  initialGalleryPhotoIds,
  initialFavorited,
  viewerTier,
  dict,
  cardDict,
  labels,
  reportDict,
  reportReasons,
}: {
  initialProfile: SerializedProfile;
  initialGalleryPhotoIds: string[];
  initialFavorited: boolean;
  viewerTier: Tier;
  dict: Dictionary["wanachama"]["detail"];
  cardDict: Dictionary["wanachama"]["card"];
  labels: Dictionary["common"]["labels"];
  reportDict: Dictionary["ripotiMtumiaji"]["modal"];
  reportReasons: Dictionary["common"]["reportReasons"];
}) {
  const [cards, setCards] = useState<CardEntry[]>([
    { profile: initialProfile, galleryPhotoIds: initialGalleryPhotoIds, favorited: initialFavorited },
  ]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const shownIds = useRef(new Set([initialProfile.userId]));
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<() => void>(() => {});

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles?sort=recent&page=${page}`);
      const json = await res.json();
      if (!res.ok) {
        setHasMore(false);
        return;
      }
      const fresh: SerializedProfile[] = json.profiles.filter(
        (p: SerializedProfile) => !shownIds.current.has(p.userId)
      );
      fresh.forEach((p) => shownIds.current.add(p.userId));
      setCards((prev) => [...prev, ...fresh.map((profile) => ({ profile, favorited: profile.isFavorited }))]);
      setHasMore(json.hasMore);
      setPage((p) => p + 1);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  // Kept current every render so the observer (attached once, below) always
  // calls the version of loadMore with up-to-date loading/hasMore/page —
  // an empty-deps effect would otherwise close over the first render's
  // stale values forever.
  useEffect(() => {
    loadMoreRef.current = loadMore;
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "600px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-6">
      {cards.map(({ profile, galleryPhotoIds, favorited }) => (
        <MemberDetailCard
          key={profile.userId}
          profile={profile}
          initialGalleryPhotoIds={galleryPhotoIds}
          initialFavorited={favorited}
          viewerTier={viewerTier}
          dict={dict}
          cardDict={cardDict}
          labels={labels}
          reportDict={reportDict}
          reportReasons={reportReasons}
        />
      ))}

      <div ref={sentinelRef} className="h-1" />

      {loading && <p className="py-4 text-center text-sm text-neutral-500">{dict.loadingMore}</p>}
      {!hasMore && !loading && cards.length > 1 && (
        <p className="py-4 text-center text-sm text-neutral-400">{dict.endOfFeed}</p>
      )}
    </div>
  );
}
