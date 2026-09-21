import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId, getActiveSubscription, getEffectiveTier } from "@/lib/auth";
import { daysRemainingUntil } from "@/lib/dates";
import { hasPhoto } from "@/lib/onboarding";
import { getOwnProfile } from "@/lib/onboarding-server";
import { queryMembers, queryLikedYouProfiles } from "@/lib/profiles";
import { getConversations } from "@/lib/messages";
import { getDictionary } from "@/app/[locale]/dictionaries";
import TierBadge from "@/components/TierBadge";
import MemberCard from "@/components/wanachama/MemberCard";
import LocaleLink from "@/components/LocaleLink";
import { CameraIcon, ClockIcon, ChatIcon, HeartFilledIcon, ChevronRightIcon } from "@/components/icons";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/ingia");

  const [tier, profile] = await Promise.all([getEffectiveTier(userId), getOwnProfile(userId)]);
  const [user, subscription, conversations, favoritedCount, likedYou, membersPreview, dict] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    getActiveSubscription(userId),
    getConversations(userId),
    prisma.favorite.count({ where: { userId } }),
    queryLikedYouProfiles(userId, tier),
    queryMembers({ viewerId: userId, viewerGender: profile?.gender ?? null, tier, page: 1 }),
    getDictionary(),
  ]);
  const t = dict.dashibodi;

  const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const latestConversation = conversations[0] ?? null;
  const daysRemaining = subscription ? daysRemainingUntil(subscription.expiryDate) : 0;
  const suggested = membersPreview.profiles.slice(0, 4);

  const checklist = [
    { done: hasPhoto(profile), label: t.addPhotoChecklist, href: "/onboarding/photo", icon: CameraIcon },
  ].filter((item) => !item.done);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-navy">
        {t.welcome}, {user?.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-neutral-600">{t.subtitle}</p>

      {checklist.length > 0 && (
        <div className="mt-6 space-y-2">
          {checklist.map((item) => (
            <LocaleLink
              key={item.href + item.label}
              href={item.href}
              className="flex items-center justify-between gap-3 rounded-xl bg-blush-50 px-4 py-3 text-sm text-primary-dark transition hover:bg-blush-100"
            >
              <span className="flex items-center gap-2">
                <item.icon className="h-4 w-4" /> {item.label}
              </span>
              <ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />
            </LocaleLink>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t.packageLabel}</p>
          <div className="mt-2 flex items-center gap-2">
            <TierBadge tier={tier} freeLabel={dict.common.tiers.FREE} />
          </div>
          {subscription && (
            <p className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
              <ClockIcon className="h-3.5 w-3.5" /> {t.daysRemaining.replace("{days}", String(daysRemaining))}
            </p>
          )}
        </div>

        <LocaleLink
          href="/ujumbe"
          className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <ChatIcon className="h-3.5 w-3.5" /> {t.messagesLabel}
          </p>
          <p className="mt-2 text-2xl font-bold text-navy">{unreadMessages}</p>
          <p className="mt-1 truncate text-xs text-neutral-500">
            {latestConversation ? `${latestConversation.otherUserName}: ${latestConversation.lastMessageBody}` : t.noMessagesYet}
          </p>
        </LocaleLink>

        <LocaleLink
          href="/wanachama/wamenipenda"
          className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <HeartFilledIcon className="h-3.5 w-3.5" /> {t.likedYouLabel}
          </p>
          <p className="mt-2 text-2xl font-bold text-navy">{likedYou.gated ? likedYou.count : likedYou.profiles.length}</p>
          <p className="mt-1 text-xs text-neutral-500">{likedYou.gated ? t.upgradeToSeeWho : t.viewAll}</p>
        </LocaleLink>

        <LocaleLink
          href="/wanachama/vipendwa"
          className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t.favoritedLabel}</p>
          <p className="mt-2 text-2xl font-bold text-navy">{favoritedCount}</p>
          <p className="mt-1 text-xs text-neutral-500">{t.savedProfiles}</p>
        </LocaleLink>
      </div>

      {suggested.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy">{t.suggestedHeading}</h2>
            <LocaleLink href="/wanachama" className="text-sm font-semibold text-primary hover:underline">
              {t.viewAllLink}
            </LocaleLink>
          </div>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {suggested.map((p) => (
              <MemberCard key={p.userId} profile={p} dict={dict.wanachama.card} labels={dict.common.labels} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
