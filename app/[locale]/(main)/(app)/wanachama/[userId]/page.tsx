import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { isEligibleTarget, serializeProfileForViewer, type SerializedProfile } from "@/lib/profiles";
import { isBlocked } from "@/lib/blocks";
import { getDictionary } from "@/app/[locale]/dictionaries";
import MemberDetailActions from "@/components/wanachama/MemberDetailActions";
import ProfilePhotoCarousel from "@/components/wanachama/ProfilePhotoCarousel";
import { LockIcon, MapPinIcon, ShieldCheckIcon } from "@/components/icons";
import {
  isIntention,
  isMaritalStatus,
  isMadhhab,
  isPrayerHabit,
  isHijabOption,
  isQuranLevel,
  isSubstanceUseOption,
  isEducationLevel,
  isBodyType,
  isSkinTone,
  isIncomeRange,
} from "@/lib/onboarding";

function DetailRow({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === "") return null;
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-navy">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-black/5 pt-5">
      <h2 className="text-sm font-semibold text-navy">{title}</h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">{children}</dl>
    </div>
  );
}

function labelOf<T extends string>(
  value: string | null,
  guard: (v: string) => v is T,
  labels: Record<T, string>
): string | null {
  return value && guard(value) ? labels[value] : null;
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const viewerId = await getSessionUserId();
  if (!viewerId) redirect("/ingia");
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
  const location = [profile.city, profile.region].filter(Boolean).join(", ");
  const isFemale = profile.gender === "FEMALE";
  const partnerAgeRange =
    profile.partnerAgeMin !== null && profile.partnerAgeMax !== null
      ? `${profile.partnerAgeMin} - ${profile.partnerAgeMax}`
      : null;

  const t = dict.wanachama.detail;
  const cardT = dict.wanachama.card;
  const labels = dict.common.labels;

  return (
    <div className="bg-hero-photo">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <ProfilePhotoCarousel
            userId={profile.userId}
            hasPhoto={profile.hasPhoto}
            name={profile.name}
            extraPhotoIds={photos.map((p) => p.id)}
            isOnline={profile.isOnline}
          />

          <div className="p-6">
            <p className="flex items-center gap-1.5 text-xl font-bold text-navy">
              {profile.name}
              {profile.age !== null && <span className="font-normal text-neutral-500">, {profile.age}</span>}
              {profile.isVerified && (
                <span title={cardT.verifiedTitle}>
                  <ShieldCheckIcon className="h-5 w-5 shrink-0 text-primary" />
                </span>
              )}
            </p>
            {location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
                <MapPinIcon className="h-4 w-4" /> {location}
              </p>
            )}

            {profile.intentions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.intentions.filter(isIntention).map((intention) => (
                  <span
                    key={intention}
                    className="rounded-full bg-blush-50 px-3 py-1 text-xs font-medium text-primary-dark"
                  >
                    {cardT.seekingPrefix} {labels.intention[intention]}
                  </span>
                ))}
              </div>
            )}

            {profile.bio && <p className="mt-4 text-sm text-neutral-600">{profile.bio}</p>}

            <div className="mt-5 space-y-5">
              <Section title={t.religionSection}>
                <DetailRow label={t.madhhabLabel} value={labelOf(profile.madhhab, isMadhhab, labels.madhhab)} />
                <DetailRow
                  label={t.prayerLabel}
                  value={labelOf(profile.prayerHabit, isPrayerHabit, labels.prayerHabit)}
                />
                <DetailRow
                  label={t.quranLabel}
                  value={labelOf(profile.quranLevel, isQuranLevel, labels.quranLevel)}
                />
                <DetailRow
                  label={t.substanceLabel}
                  value={labelOf(profile.substanceUse, isSubstanceUseOption, labels.substanceUse)}
                />
                {isFemale && (
                  <DetailRow label={t.hijabLabel} value={labelOf(profile.wearsHijab, isHijabOption, labels.hijabOption)} />
                )}
              </Section>

              <Section title={t.lifeSection}>
                <DetailRow
                  label={t.maritalStatusLabel}
                  value={labelOf(profile.maritalStatus, isMaritalStatus, labels.maritalStatus)}
                />
                <DetailRow label={t.occupationLabel} value={profile.occupation} />
                <DetailRow
                  label={t.educationLabel}
                  value={labelOf(profile.educationLevel, isEducationLevel, labels.educationLevel)}
                />
                <DetailRow label={t.heightLabel} value={profile.height ? `${profile.height} ${t.heightUnit}` : null} />
                <DetailRow label={t.bodyTypeLabel} value={labelOf(profile.bodyType, isBodyType, labels.bodyType)} />
                <DetailRow label={t.skinToneLabel} value={labelOf(profile.skinTone, isSkinTone, labels.skinTone)} />
                <DetailRow
                  label={t.incomeLabel}
                  value={labelOf(profile.incomeRange, isIncomeRange, labels.incomeRange)}
                />
              </Section>

              {partnerAgeRange && (
                <Section title={t.lookingForSection}>
                  <DetailRow label={t.partnerAgeLabel} value={partnerAgeRange} />
                </Section>
              )}
            </div>

            <div className="mt-5 flex items-center gap-1.5 border-t border-black/5 pt-5 text-sm">
              {profile.contactVisible ? (
                <span className="text-neutral-600">{profile.phone}</span>
              ) : (
                <span className="flex items-center gap-1 text-neutral-400">
                  <LockIcon className="h-4 w-4" /> {t.contactLocked}
                </span>
              )}
            </div>

            <MemberDetailActions
              userId={profile.userId}
              userName={profile.name}
              initialFavorited={!!favorite}
              dict={t}
              cardLabels={cardT}
              reportDict={dict.ripotiMtumiaji.modal}
              reportReasons={dict.common.reportReasons}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
