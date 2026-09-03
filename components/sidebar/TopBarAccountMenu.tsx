"use client";

import { useEffect, useRef, useState } from "react";
import LocaleLink from "@/components/LocaleLink";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import { logoutAction } from "@/lib/actions";
import type { Tier } from "@/lib/tiers";
import type { Dictionary } from "@/app/[locale]/dictionaries";
import { ChevronDownIcon, ArrowRightIcon } from "@/components/icons";

export default function TopBarAccountMenu({
  name,
  hasPhoto,
  tier,
  dict,
  tiers,
}: {
  name: string;
  hasPhoto: boolean;
  tier: Tier;
  dict: Dictionary["common"]["topBar"]["accountMenu"];
  tiers: Dictionary["common"]["tiers"];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border-[1.5px] border-blush-200 py-1 ps-1 pe-2.5 transition hover:bg-blush-50"
      >
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- private cookie-gated route, see Nav.tsx's AccountAvatar
          <img src="/api/onboarding/photo" alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <AvatarIllustration name={name} className="h-7 w-7 rounded-full" />
        )}
        <span className="hidden text-start sm:block">
          <span className="block text-xs font-semibold leading-tight text-navy">{name.split(" ")[0]}</span>
          <span className="block text-[10px] font-medium leading-tight text-primary">{tiers[tier]}</span>
        </span>
        <ChevronDownIcon className="h-3.5 w-3.5 text-neutral-400" />
      </button>

      {open && (
        <div className="absolute end-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-black/5 bg-white py-1.5 shadow-lg">
          <LocaleLink
            href="/akaunti"
            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-blush-50"
            onClick={() => setOpen(false)}
          >
            {dict.akauntiYangu}
          </LocaleLink>
          <LocaleLink
            href="/wasifu-wangu"
            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-blush-50"
            onClick={() => setOpen(false)}
          >
            {dict.wasifuWangu}
          </LocaleLink>
          <LocaleLink
            href="/mipangilio"
            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-blush-50"
            onClick={() => setOpen(false)}
          >
            {dict.mipangilio}
          </LocaleLink>
          <form action={logoutAction} className="border-t border-black/5">
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-2 text-start text-sm text-neutral-700 hover:bg-blush-50"
            >
              <ArrowRightIcon className="h-3.5 w-3.5 rotate-180" /> {dict.logout}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
