import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { isEligibleTarget, serializeProfileForViewer, type SerializedProfile } from "@/lib/profiles";
import { isBlocked } from "@/lib/blocks";
import { checkViewAccess, recordProfileView } from "@/lib/profile-views";
import { getDictionary, getLocale } from "@/app/[locale]/dictionaries";
import { localeHref } from "@/lib/i18n/href";
import LocaleLink from "@/components/LocaleLink";
import { ClockIcon } from "@/components/icons";
import ProfileFeed from "@/components/wanachama/ProfileFeed";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const [viewerId, locale] = await Promise.all([getSessionUserId(), getLocale()]);
  if (!viewerId) redirect(localeHref(locale, "/ingia"));
  const { userId: targetId } = await params;

  const [tier, viewer, target, favorite, photos, dict] = await Promise.all([
    getEffectiveTier(viewerId),
    prisma.profile.findUnique({ where: { userId: viewerId }, select: { gender: true } }),
    prisma.profile.findUnique({
      where: { userId: targetId },
      include: { user: { select: { name: true } } },
    }),
    prisma.favorite.findUnique({
      where: { userId_favoritedUserId: { userId: viewerId, favoritedUserId: targetId } },
      select: { id: true },
    }),
    prisma.profilePhoto.findMany({
      where: { profile: { userId: targetId } },
      orderBy: { position: "asc" },
      select: { id: true },
    }),
    getDictionary(),
  ]);

  if (!target || !isEligibleTarget(viewer?.gender, target.gender)) notFound();
  if (await isBlocked(viewerId, targetId)) notFound();

  // The real enforcement point for each tier's profileViewLimit (a genuine
  // per-day allowance, see lib/profile-views.ts) — the browse list shows
  // the full matching pool regardless of tier, and this is the one place a
  // profile is actually opened, covering every entry path (browse, search,
  // favorites, liked-you) uniformly.
  const access = await checkViewAccess(viewerId, targetId, tier);
  if (!access.allowed) {
    const lt = dict.wanachama.viewLimitReached;
    return (
      <div className="bg-hero-photo">
        <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
          <ClockIcon className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-xl font-bold text-navy">{lt.heading}</h1>
          <p className="mt-2 text-sm text-neutral-600">{lt.body.replace("{limit}", String(access.limit))}</p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <LocaleLink
              href="/boresha-kifurushi"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              {lt.upgradeButton}
            </LocaleLink>
            <LocaleLink href="/wanachama" className="text-sm font-medium text-neutral-500 hover:text-primary">
              {lt.backButton}
            </LocaleLink>
          </div>
        </div>
      </div>
    );
  }

  await recordProfileView(viewerId, targetId);

  const profile: SerializedProfile = serializeProfileForViewer(target, tier);

  return (
    <div className="bg-hero-photo">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <ProfileFeed
          initialProfile={profile}
          initialGalleryPhotoIds={photos.map((p) => p.id)}
          initialFavorited={!!favorite}
          viewerTier={tier}
          dict={dict.wanachama.detail}
          cardDict={dict.wanachama.card}
          labels={dict.common.labels}
          reportDict={dict.ripotiMtumiaji.modal}
          reportReasons={dict.common.reportReasons}
        />
      </div>
    </div>
  );
}
