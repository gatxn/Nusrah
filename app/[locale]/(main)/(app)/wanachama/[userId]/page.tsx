import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { isEligibleTarget, serializeProfileForViewer, type SerializedProfile } from "@/lib/profiles";
import { isBlocked } from "@/lib/blocks";
import { getDictionary, getLocale } from "@/app/[locale]/dictionaries";
import { localeHref } from "@/lib/i18n/href";
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

  const profile: SerializedProfile = serializeProfileForViewer(target, tier);

  return (
    <div className="bg-hero-photo">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <ProfileFeed
          initialProfile={profile}
          initialGalleryPhotoIds={photos.map((p) => p.id)}
          initialFavorited={!!favorite}
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
