"use client";

import { useEffect, useState } from "react";
import MemberDetailActions from "@/components/wanachama/MemberDetailActions";
import ProfilePhotoCarousel from "@/components/wanachama/ProfilePhotoCarousel";
import { ChevronDownIcon, LockIcon, MapPinIcon, ShieldCheckIcon } from "@/components/icons";
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
import type { SerializedProfile } from "@/lib/profiles";
import type { Dictionary } from "@/app/[locale]/dictionaries";

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

export default function MemberDetailCard({
  profile,
  initialGalleryPhotoIds,
  initialFavorited,
  dict,
  cardDict,
  labels,
  reportDict,
  reportReasons,
}: {
  profile: SerializedProfile;
  initialGalleryPhotoIds?: string[];
  initialFavorited: boolean;
  dict: Dictionary["wanachama"]["detail"];
  cardDict: Dictionary["wanachama"]["card"];
  labels: Dictionary["common"]["labels"];
  reportDict: Dictionary["ripotiMtumiaji"]["modal"];
  reportReasons: Dictionary["common"]["reportReasons"];
}) {
  // The very first card on the page gets its gallery photo ids from the
  // server (no extra round trip); every card the feed loads afterward
  // fetches its own — there's no batched way to get gallery ids for a page
  // of profiles without changing the shared card-view query shape.
  const [galleryPhotoIds, setGalleryPhotoIds] = useState<string[]>(initialGalleryPhotoIds ?? []);
  // Mobile-only: the photo takes the screen and details start collapsed
  // below it, revealed by the "show more details" toggle. Desktop shows
  // both side by side, so this state is simply ignored there (see the
  // lg:grid-rows-[1fr] override below).
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (initialGalleryPhotoIds !== undefined) return;
    let cancelled = false;
    fetch(`/api/profiles/${profile.userId}/photos`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json?.photos) {
          setGalleryPhotoIds(json.photos.map((p: { id: string }) => p.id));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per card instance (keyed by userId in the feed)
  }, []);

  const location = [profile.city, profile.region].filter(Boolean).join(", ");
  const isFemale = profile.gender === "FEMALE";
  const partnerAgeRange =
    profile.partnerAgeMin !== null && profile.partnerAgeMax !== null
      ? `${profile.partnerAgeMin} - ${profile.partnerAgeMax}`
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm lg:flex lg:h-[70vh] lg:max-h-[720px]">
      <div className="lg:h-full lg:w-[45%] lg:shrink-0">
        <ProfilePhotoCarousel
          userId={profile.userId}
          hasPhoto={profile.hasPhoto}
          name={profile.name}
          extraPhotoIds={galleryPhotoIds}
          isOnline={profile.isOnline}
        />
      </div>

      <div className="lg:h-full lg:flex-1 lg:overflow-y-auto">
        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          aria-expanded={detailsOpen}
          className="flex w-full items-center justify-center gap-1.5 border-b border-black/5 py-3 text-sm font-semibold text-primary lg:hidden"
        >
          {detailsOpen ? dict.hideDetails : dict.showMoreDetails}
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out lg:grid-rows-[1fr] ${
            detailsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="p-6">
              <p className="flex items-center gap-1.5 text-xl font-bold text-navy">
                {profile.name}
                {profile.age !== null && (
                  <span className="font-normal text-neutral-500">, {profile.age}</span>
                )}
                {profile.isVerified && (
                  <span title={cardDict.verifiedTitle}>
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
                      {cardDict.seekingPrefix} {labels.intention[intention]}
                    </span>
                  ))}
                </div>
              )}

              {profile.bio && <p className="mt-4 text-sm text-neutral-600">{profile.bio}</p>}

              <div className="mt-5 space-y-5">
                <Section title={dict.religionSection}>
                  <DetailRow
                    label={dict.madhhabLabel}
                    value={labelOf(profile.madhhab, isMadhhab, labels.madhhab)}
                  />
                  <DetailRow
                    label={dict.prayerLabel}
                    value={labelOf(profile.prayerHabit, isPrayerHabit, labels.prayerHabit)}
                  />
                  <DetailRow
                    label={dict.quranLabel}
                    value={labelOf(profile.quranLevel, isQuranLevel, labels.quranLevel)}
                  />
                  <DetailRow
                    label={dict.substanceLabel}
                    value={labelOf(profile.substanceUse, isSubstanceUseOption, labels.substanceUse)}
                  />
                  {isFemale && (
                    <DetailRow
                      label={dict.hijabLabel}
                      value={labelOf(profile.wearsHijab, isHijabOption, labels.hijabOption)}
                    />
                  )}
                </Section>

                <Section title={dict.lifeSection}>
                  <DetailRow
                    label={dict.maritalStatusLabel}
                    value={labelOf(profile.maritalStatus, isMaritalStatus, labels.maritalStatus)}
                  />
                  <DetailRow label={dict.occupationLabel} value={profile.occupation} />
                  <DetailRow
                    label={dict.educationLabel}
                    value={labelOf(profile.educationLevel, isEducationLevel, labels.educationLevel)}
                  />
                  <DetailRow
                    label={dict.heightLabel}
                    value={profile.height ? `${profile.height} ${dict.heightUnit}` : null}
                  />
                  <DetailRow label={dict.bodyTypeLabel} value={labelOf(profile.bodyType, isBodyType, labels.bodyType)} />
                  <DetailRow label={dict.skinToneLabel} value={labelOf(profile.skinTone, isSkinTone, labels.skinTone)} />
                  <DetailRow
                    label={dict.incomeLabel}
                    value={labelOf(profile.incomeRange, isIncomeRange, labels.incomeRange)}
                  />
                </Section>

                {partnerAgeRange && (
                  <Section title={dict.lookingForSection}>
                    <DetailRow label={dict.partnerAgeLabel} value={partnerAgeRange} />
                  </Section>
                )}
              </div>

              <div className="mt-5 flex items-center gap-1.5 border-t border-black/5 pt-5 text-sm">
                {profile.contactVisible ? (
                  <span className="text-neutral-600">{profile.phone}</span>
                ) : (
                  <span className="flex items-center gap-1 text-neutral-400">
                    <LockIcon className="h-4 w-4" /> {dict.contactLocked}
                  </span>
                )}
              </div>

              <MemberDetailActions
                userId={profile.userId}
                userName={profile.name}
                initialFavorited={initialFavorited}
                dict={dict}
                cardLabels={cardDict}
                reportDict={reportDict}
                reportReasons={reportReasons}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
