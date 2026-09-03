import { redirect } from "next/navigation";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { queryLikedYouProfiles } from "@/lib/profiles";
import { getDictionary } from "@/app/[locale]/dictionaries";
import MemberCard from "@/components/wanachama/MemberCard";
import WanachamaTabs from "@/components/wanachama/WanachamaTabs";
import LocaleLink from "@/components/LocaleLink";
import { HeartFilledIcon } from "@/components/icons";

export default async function WamenipendaPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/ingia");

  const [tier, dict] = await Promise.all([getEffectiveTier(userId), getDictionary()]);
  const result = await queryLikedYouProfiles(userId, tier);
  const t = dict.wamenipenda;

  return (
    <div className="bg-hero-photo">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t.heading}</h1>
          <p className="mt-1 text-sm text-neutral-600">{t.subtitle}</p>
        </div>

        <WanachamaTabs active="liked-you" />

        <div className="mt-6">
          {result.gated ? (
            <div className="mt-8 rounded-2xl border border-blush-200 bg-blush-50 p-8 text-center">
              <HeartFilledIcon className="mx-auto h-9 w-9 text-primary" />
              <p className="mt-3 text-lg font-bold text-navy">
                {result.count > 0 ? t.someoneLiked.replace("{count}", String(result.count)) : t.noOneYet}
              </p>
              {result.count > 0 && <p className="mt-1 text-sm text-neutral-600">{t.upgradeHint}</p>}
              <LocaleLink
                href="/boresha-kifurushi"
                className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                {t.upgradeButton}
              </LocaleLink>
            </div>
          ) : result.profiles.length === 0 ? (
            <div className="mt-14 text-center">
              <p className="text-sm text-neutral-500">{t.emptyState}</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.profiles.map((profile) => (
                <MemberCard key={profile.userId} profile={profile} dict={dict.wanachama.card} labels={dict.common.labels} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
