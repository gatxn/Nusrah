"use client";

import { usePathname } from "next/navigation";
import { pathnameWithoutLocale } from "@/lib/i18n/href";
import { SearchIcon } from "@/components/icons";

// Member search only makes sense on pages that actually browse/list members
// or people you're in contact with — not on static content (FAQ, Safety
// Center, Terms), forms (My Profile, Settings, Contact Support), or Report
// User (which already has its own dedicated search box).
const SEARCH_ENABLED_PATHS = ["/dashibodi", "/wanachama", "/ujumbe"];

export default function TopBarSearch({
  searchActionHref,
  placeholder,
}: {
  searchActionHref: string;
  placeholder: string;
}) {
  const pathname = usePathname();
  const path = pathnameWithoutLocale(pathname ?? "/");
  const showSearch = SEARCH_ENABLED_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  if (!showSearch) return null;

  return (
    <form action={searchActionHref} method="GET" className="relative min-w-0 flex-1 max-w-md">
      <SearchIcon className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-neutral-400" />
      <input
        type="text"
        name="search"
        placeholder={placeholder}
        className="w-full rounded-full border border-black/10 bg-blush-50/60 py-2 ps-9 pe-3 text-sm focus:border-primary focus:bg-white focus:outline-none"
      />
    </form>
  );
}
