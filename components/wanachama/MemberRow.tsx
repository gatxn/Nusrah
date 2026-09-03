import LocaleLink from "@/components/LocaleLink";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import FavoriteButton from "@/components/wanachama/FavoriteButton";
import MessageShortcutButton from "@/components/wanachama/MessageShortcutButton";
import { LockIcon, MapPinIcon, ShieldCheckIcon } from "@/components/icons";
import { isIntention, isEducationLevel, isMadhhab } from "@/lib/onboarding";
import type { Dictionary } from "@/app/[locale]/dictionaries";
import type { SerializedProfile } from "@/lib/profiles";

export default function MemberRow({
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
  const detailLine = [educationLabel, profile.occupation, madhhabLabel].filter(Boolean).join(" • ");
  const topIntention = profile.intentions.filter(isIntention)[0];

  return (
    <LocaleLink
      href={`/wanachama/${profile.userId}`}
      className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-blush-50">
        {profile.hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route; see MemberCard.tsx's note
          <img src={`/api/profiles/${profile.userId}/photo`} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <AvatarIllustration name={profile.name} className="h-9 w-9" />
          </div>
        )}
        {profile.isNew && (
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
            {t.newBadge}
          </span>
        )}
        {profile.isOnline && (
          <span
            aria-label={t.onlineAria}
            title={t.onlineAria}
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate font-semibold text-navy">
          {profile.name}
          {profile.age !== null && <span className="font-normal text-neutral-500">, {profile.age}</span>}
          {profile.isVerified && (
            <span title={t.verifiedTitle}>
              <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
            </span>
          )}
        </p>
        {location && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{location}</span>
          </p>
        )}
        {detailLine && <p className="mt-0.5 truncate text-xs text-neutral-500">{detailLine}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          {topIntention && (
            <span className="rounded-full bg-blush-50 px-2 py-0.5 font-medium text-primary-dark">
              {labels.intention[topIntention]}
            </span>
          )}
          {!profile.contactVisible && (
            <span className="flex items-center gap-1 text-neutral-400">
              <LockIcon className="h-3 w-3" /> {t.contactLocked}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <MessageShortcutButton userId={profile.userId} ariaLabel={t.sendMessageAria} />
        <FavoriteButton favoritedUserId={profile.userId} initialFavorited={profile.isFavorited} labels={t} />
      </div>
    </LocaleLink>
  );
}
