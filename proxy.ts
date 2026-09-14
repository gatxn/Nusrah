import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["sw", "ar", "fr", "zh"] as const;
const DEFAULT_LOCALE = "en";

// English is the default a first-time visitor sees (unprefixed, rewritten
// internally to /en/...). Swahili/Arabic require an explicit /sw or /ar
// prefix. Once a visitor has picked a locale (any locale-prefixed page they
// land on), the NEXT_LOCALE cookie set below is what every subsequent
// server-side redirect (localeHref/withLocale) reads to keep them there.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const prefixed = LOCALES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (prefixed) {
    const res = NextResponse.next();
    res.cookies.set("NEXT_LOCALE", prefixed);
    return res;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  const res = NextResponse.rewrite(url);
  res.cookies.set("NEXT_LOCALE", DEFAULT_LOCALE);
  return res;
}

export const config = {
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
