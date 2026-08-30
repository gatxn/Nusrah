import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { isEligibleTarget, serializeProfileForViewer } from "@/lib/profiles";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import MemberDetailActions from "@/components/wanachama/MemberDetailActions";
import { LockIcon, MapPinIcon } from "@/components/icons";
import { INTENTION_LABELS } from "@/lib/onboarding";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const viewerId = await getSessionUserId();
  if (!viewerId) redirect("/ingia");
  const { userId: targetId } = await params;

  const [tier, viewer, target, favorite] = await Promise.all([
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
  ]);

  if (!target || !isEligibleTarget(viewer?.gender, target.gender)) notFound();

  const profile = serializeProfileForViewer(target, tier);
  const location = [profile.city, profile.region].filter(Boolean).join(", ");

  return (
    <div className="bg-hero-photo">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="relative h-72 w-full bg-blush-50">
            {profile.hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route
              <img
                src={`/api/profiles/${profile.userId}/photo`}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <AvatarIllustration name={profile.name} className="h-28 w-28" />
              </div>
            )}
          </div>

          <div className="p-6">
            <p className="text-xl font-bold text-navy">
              {profile.name}
              {profile.age !== null && <span className="font-normal text-neutral-500">, {profile.age}</span>}
            </p>
            {location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
                <MapPinIcon className="h-4 w-4" /> {location}
              </p>
            )}

            {profile.intentions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.intentions.map((intention) => (
                  <span
                    key={intention}
                    className="rounded-full bg-blush-50 px-3 py-1 text-xs font-medium text-primary-dark"
                  >
                    Anatafuta: {INTENTION_LABELS[intention]}
                  </span>
                ))}
              </div>
            )}

            {profile.bio && <p className="mt-4 text-sm text-neutral-600">{profile.bio}</p>}

            <div className="mt-4 flex items-center gap-1.5 text-sm">
              {profile.contactVisible ? (
                <span className="text-neutral-600">{profile.phone}</span>
              ) : (
                <span className="flex items-center gap-1 text-neutral-400">
                  <LockIcon className="h-4 w-4" /> Mawasiliano yamefungwa — boresha kifurushi chako
                </span>
              )}
            </div>

            <MemberDetailActions userId={profile.userId} initialFavorited={!!favorite} />
          </div>
        </div>
      </div>
    </div>
  );
}
