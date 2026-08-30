"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { swapLocale } from "@/lib/i18n/href";
import type { Locale } from "@/app/[locale]/dictionaries";

const NAMES: Record<Locale, string> = { sw: "Kiswahili", en: "English", ar: "العربية" };
const ORDER: Locale[] = ["sw", "en", "ar"];

function Select({ currentLocale, label }: { currentLocale: Locale; label: string }) {
  return (
    <select
      aria-label={label}
      defaultValue={currentLocale}
      disabled
      className="rounded-full border-[1.5px] border-blush-200 bg-white px-3 py-1.5 text-sm font-medium text-navy focus:border-primary focus:outline-none"
    >
      {ORDER.map((l) => (
        <option key={l} value={l}>
          {NAMES[l]}
        </option>
      ))}
    </select>
  );
}

function LanguageSwitcherInner({ currentLocale, label }: { currentLocale: Locale; label: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const search = searchParams.toString();
    router.push(swapLocale(pathname, search ? `?${search}` : "", e.target.value));
  }

  return (
    <select
      aria-label={label}
      value={currentLocale}
      onChange={handleChange}
      className="rounded-full border-[1.5px] border-blush-200 bg-white px-3 py-1.5 text-sm font-medium text-navy focus:border-primary focus:outline-none"
    >
      {ORDER.map((l) => (
        <option key={l} value={l}>
          {NAMES[l]}
        </option>
      ))}
    </select>
  );
}

// useSearchParams() opts the page into per-request rendering unless wrapped
// in Suspense — this boundary keeps the rest of a page (e.g. /ingia)
// statically prerenderable, matching every other route in the app.
export default function LanguageSwitcher(props: { currentLocale: Locale; label: string }) {
  return (
    <Suspense fallback={<Select {...props} />}>
      <LanguageSwitcherInner {...props} />
    </Suspense>
  );
}
