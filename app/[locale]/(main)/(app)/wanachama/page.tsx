import { redirect } from "next/navigation";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { getOwnProfile } from "@/lib/onboarding-server";
import { queryMembers } from "@/lib/profiles";
import { TIER_CAPABILITIES } from "@/lib/tiers";
import { getDictionary } from "@/app/[locale]/dictionaries";
import MembersBrowser from "@/components/wanachama/MembersBrowser";
import WanachamaTabs from "@/components/wanachama/WanachamaTabs";

export default async function WanachamaPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/ingia");

  const [{ search }, tier, viewer, dict] = await Promise.all([
    searchParams,
    getEffectiveTier(userId),
    getOwnProfile(userId),
    getDictionary(),
  ]);

  const result = await queryMembers({
    viewerId: userId,
    viewerGender: viewer?.gender ?? null,
    tier,
    page: 1,
    search,
  });

  const t = dict.wanachama;

  return (
    <div className="bg-hero-photo">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">{t.pageHeading}</h1>
            <p className="mt-1 text-sm text-neutral-600">{t.pageSubtitle}</p>
          </div>
        </div>

        <WanachamaTabs active="browse" />

        <div className="mt-6">
          <MembersBrowser
            initialProfiles={result.profiles}
            initialHasMore={result.hasMore}
            viewLimit={
              Number.isFinite(TIER_CAPABILITIES[tier].profileViewLimit)
                ? TIER_CAPABILITIES[tier].profileViewLimit
                : null
            }
            mode="browse"
            viewerGender={viewer?.gender ?? null}
            initialSearch={search ?? ""}
            dict={t}
            labels={dict.common.labels}
          />
        </div>
      </div>
    </div>
  );
}
