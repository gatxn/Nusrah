const LOCALE_PREFIXES = ["sw", "ar"] as const;

function prefixFromPathname(pathname: string): string {
  const seg = pathname.split("/")[1];
  return (LOCALE_PREFIXES as readonly string[]).includes(seg) ? `/${seg}` : "";
}

// For programmatic navigation (router.push/window.location.href) in Client
// Components, where the current pathname is already known (usePathname()).
// English stays unprefixed (proxy.ts rewrites it internally), sw/ar keep
// whatever prefix the current page already has.
export function withLocale(currentPathname: string, targetPath: string): string {
  return `${prefixFromPathname(currentPathname)}${targetPath}`;
}

// For Server Components/Route Handlers that already know the current locale
// (via getLocale() or localeFromRequest()) and need to build a
// locale-prefixed path — e.g. before calling next/navigation's redirect(),
// which has no pathname of its own to derive a prefix from the way
// withLocale() does on the client.
export function localeHref(locale: string, targetPath: string): string {
  const prefix = (LOCALE_PREFIXES as readonly string[]).includes(locale) ? `/${locale}` : "";
  return `${prefix}${targetPath}`;
}

// For Client Components that need to match the current route against a
// logical (unprefixed) path — e.g. deciding whether to show a piece of UI on
// this page — regardless of which locale prefix (if any) is actually in the
// URL.
export function pathnameWithoutLocale(pathname: string): string {
  const seg = pathname.split("/")[1];
  return (LOCALE_PREFIXES as readonly string[]).includes(seg) ? pathname.slice(seg.length + 1) || "/" : pathname;
}

// For the language switcher: swap the current URL's locale prefix for a
// different one (or drop it entirely for English, the unprefixed default),
// keeping the rest of the path (and any query string) unchanged.
export function swapLocale(currentPathname: string, search: string, newLocale: string): string {
  const seg = currentPathname.split("/")[1];
  const hasPrefix = (LOCALE_PREFIXES as readonly string[]).includes(seg);
  const rest = hasPrefix ? currentPathname.slice(seg.length + 1) || "/" : currentPathname;
  const prefix = newLocale === "en" ? "" : `/${newLocale}`;
  return `${prefix}${rest}${search}`;
}
