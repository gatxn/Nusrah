import { redirect } from "next/navigation";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { getOwnProfile } from "@/lib/onboarding-server";
import { prisma } from "@/lib/db";
import { queryMembers } from "@/lib/profiles";
import { TIER_CAPABILITIES } from "@/lib/tiers";
import MembersBrowser from "@/components/wanachama/MembersBrowser";
import WanachamaTabs from "@/components/wanachama/WanachamaTabs";

export default async function VipendwaPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/ingia");

  const [tier, viewer, favoriteRows] = await Promise.all([
    getEffectiveTier(userId),
    getOwnProfile(userId),
    prisma.favorite.findMany({ where: { userId }, select: { favoritedUserId: true } }),
  ]);
  const viewerFavoriteIds = new Set(favoriteRows.map((f) => f.favoritedUserId));

  const result = await queryMembers({
    viewerId: userId,
    viewerGender: viewer?.gender ?? null,
    tier,
    page: 1,
    favoritedOnly: true,
    viewerFavoriteIds,
  });

  return (
    <div className="bg-hero-photo">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Ninaowapenda</h1>
          <p className="mt-1 text-sm text-neutral-600">Wanachama uliowapenda</p>
        </div>

        <WanachamaTabs active="favorites" />

        <div className="mt-6">
          <MembersBrowser
            initialProfiles={result.profiles}
            initialHasMore={result.hasMore}
            viewLimit={
              Number.isFinite(TIER_CAPABILITIES[tier].profileViewLimit)
                ? TIER_CAPABILITIES[tier].profileViewLimit
                : null
            }
            mode="favorites"
          />
        </div>
      </div>
    </div>
  );
}
