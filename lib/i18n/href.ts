const LOCALE_PREFIXES = ["en", "ar"] as const;

function prefixFromPathname(pathname: string): string {
  const seg = pathname.split("/")[1];
  return (LOCALE_PREFIXES as readonly string[]).includes(seg) ? `/${seg}` : "";
}

// For programmatic navigation (router.push/window.location.href) in Client
// Components, where the current pathname is already known (usePathname()).
// Swahili stays unprefixed (proxy.ts rewrites it internally), en/ar keep
// whatever prefix the current page already has.
export function withLocale(currentPathname: string, targetPath: string): string {
  return `${prefixFromPathname(currentPathname)}${targetPath}`;
}

// For the language switcher: swap the current URL's locale prefix for a
// different one (or drop it entirely for Swahili, the unprefixed default),
// keeping the rest of the path (and any query string) unchanged.
export function swapLocale(currentPathname: string, search: string, newLocale: string): string {
  const seg = currentPathname.split("/")[1];
  const hasPrefix = (LOCALE_PREFIXES as readonly string[]).includes(seg);
  const rest = hasPrefix ? currentPathname.slice(seg.length + 1) || "/" : currentPathname;
  const prefix = newLocale === "sw" ? "" : `/${newLocale}`;
  return `${prefix}${rest}${search}`;
}
