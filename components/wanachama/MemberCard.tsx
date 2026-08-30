import Link from "next/link";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import FavoriteButton from "@/components/wanachama/FavoriteButton";
import { LockIcon, MapPinIcon } from "@/components/icons";
import { INTENTION_LABELS } from "@/lib/onboarding";
import type { SerializedProfile } from "@/lib/profiles";

export default function MemberCard({ profile }: { profile: SerializedProfile }) {
  const location = [profile.city, profile.region].filter(Boolean).join(", ");

  return (
    <Link
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
        <FavoriteButton
          favoritedUserId={profile.userId}
          initialFavorited={profile.isFavorited}
          className="absolute right-3 top-3"
        />
      </div>

      <div className="p-4">
        <p className="font-semibold text-navy">
          {profile.name}
          {profile.age !== null && <span className="font-normal text-neutral-500">, {profile.age}</span>}
        </p>
        {location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
            <MapPinIcon className="h-3.5 w-3.5" /> {location}
          </p>
        )}

        {profile.intentions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.intentions.slice(0, 2).map((intention) => (
              <span
                key={intention}
                className="rounded-full bg-blush-50 px-2.5 py-1 text-[11px] font-medium text-primary-dark"
              >
                Anatafuta: {INTENTION_LABELS[intention]}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {profile.contactVisible ? (
            <span className="text-neutral-600">{profile.phone}</span>
          ) : (
            <span className="flex items-center gap-1 text-neutral-400">
              <LockIcon className="h-3.5 w-3.5" /> Mawasiliano yamefungwa
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
