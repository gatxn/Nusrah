import LocaleLink from "@/components/LocaleLink";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import FavoriteButton from "@/components/wanachama/FavoriteButton";
import MessageShortcutButton from "@/components/wanachama/MessageShortcutButton";
import { LockIcon, MapPinIcon, ShieldCheckIcon } from "@/components/icons";
import { isIntention, isEducationLevel, isMadhhab, isHijabOption } from "@/lib/onboarding";
import type { Dictionary } from "@/app/[locale]/dictionaries";
import type { SerializedProfile } from "@/lib/profiles";

export default function MemberCard({
  profile,
  dict: t,
  labels,
}: {
  profile: SerializedProfile;
  dict: Dictionary["wanachama"]["card"];
  labels: Dictionary["common"]["labels"];
}) {
  const location = [profile.city, profile.region].filter(Boolean).join(", ");
  const educationLabel =
    profile.educationLevel && isEducationLevel(profile.educationLevel)
      ? labels.educationLevel[profile.educationLevel]
      : null;
  const madhhabLabel = profile.madhhab && isMadhhab(profile.madhhab) ? labels.madhhab[profile.madhhab] : null;
  const hijabLabel =
    profile.wearsHijab && isHijabOption(profile.wearsHijab) ? labels.hijabOption[profile.wearsHijab] : null;
  const line1 = [educationLabel, profile.occupation].filter(Boolean).join(" • ");
  const line2 = [madhhabLabel, hijabLabel].filter(Boolean).join(" • ");

  return (
    <LocaleLink
      href={`/wanachama/${profile.userId}`}
      className="group relative block overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-48 w-full bg-blush-50">
        {profile.hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route; see FavoriteButton/Nav notes
          <img
            src={`/api/profiles/${profile.userId}/photo`}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <AvatarIllustration name={profile.name} className="h-20 w-20" />
          </div>
        )}
        {profile.isOnline && (
          <span
            aria-label={t.onlineAria}
            title={t.onlineAria}
            className="absolute bottom-3 left-3 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"
          />
        )}
        {profile.isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">
            {t.newBadge}
          </span>
        )}
        <FavoriteButton
          favoritedUserId={profile.userId}
          initialFavorited={profile.isFavorited}
          className="absolute right-3 top-3"
          labels={t}
        />
      </div>

      <div className="p-4">
        <p className="flex items-center gap-1 font-semibold text-navy">
          {profile.name}
          {profile.age !== null && <span className="font-normal text-neutral-500">, {profile.age}</span>}
          {profile.isVerified && (
            <span title={t.verifiedTitle}>
              <ShieldCheckIcon className="h-4 w-4 shrink-0 text-primary" />
            </span>
          )}
        </p>
        {location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
            <MapPinIcon className="h-3.5 w-3.5" /> {location}
          </p>
        )}
        {line1 && <p className="mt-1 truncate text-xs text-neutral-500">{line1}</p>}
        {line2 && <p className="mt-0.5 truncate text-xs text-neutral-500">{line2}</p>}

        {profile.intentions.filter(isIntention).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.intentions.filter(isIntention).slice(0, 2).map((intention) => (
              <span
                key={intention}
                className="rounded-full bg-blush-50 px-2.5 py-1 text-[11px] font-medium text-primary-dark"
              >
                {t.seekingPrefix} {labels.intention[intention]}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 text-xs">
            {profile.contactVisible ? (
              <span className="text-neutral-600">{profile.phone}</span>
            ) : (
              <span className="flex items-center gap-1 text-neutral-400">
                <LockIcon className="h-3.5 w-3.5" /> {t.contactLocked}
              </span>
            )}
          </div>
          <MessageShortcutButton userId={profile.userId} className="h-7 w-7" ariaLabel={t.sendMessageAria} />
        </div>
      </div>
    </LocaleLink>
  );
}
