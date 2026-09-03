"use client";

import { useState, type FormEvent } from "react";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import ReportUserModal from "@/components/wanachama/ReportUserModal";
import { SearchIcon } from "@/components/icons";
import type { SerializedProfile } from "@/lib/profiles";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function ReportUserSearch({
  dict,
  modalDict,
  reasons,
}: {
  dict: Dictionary["ripotiMtumiaji"]["search"];
  modalDict: Dictionary["ripotiMtumiaji"]["modal"];
  reasons: Dictionary["common"]["reportReasons"];
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SerializedProfile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles?search=${encodeURIComponent(search.trim())}&page=1`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? dict.genericError);
        setResults(null);
        return;
      }
      setResults(json.profiles);
    } catch {
      setError(dict.networkError);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2.5">
        <SearchIcon className="h-4 w-4 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={dict.placeholder}
          className="w-full text-sm outline-none"
        />
        <button
          type="submit"
          disabled={loading || !search.trim()}
          className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? dict.searching : dict.searchButton}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {results !== null && (
        <div className="mt-5 space-y-3">
          {results.length === 0 ? (
            <p className="text-sm text-neutral-500">{dict.noResults}</p>
          ) : (
            results.map((profile) => {
              const location = [profile.city, profile.region].filter(Boolean).join(", ");
              return (
                <div
                  key={profile.userId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-blush-50">
                      {profile.hasPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route; see MemberCard.tsx's note
                        <img
                          src={`/api/profiles/${profile.userId}/photo`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <AvatarIllustration name={profile.name} className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        {profile.name}
                        {profile.age !== null && <span className="font-normal text-neutral-500">, {profile.age}</span>}
                      </p>
                      {location && <p className="text-xs text-neutral-500">{location}</p>}
                    </div>
                  </div>
                  <ReportUserModal userId={profile.userId} userName={profile.name} dict={modalDict} reasons={reasons} />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
