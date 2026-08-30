import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["en", "ar"] as const;
const DEFAULT_LOCALE = "sw";

// Swahili is the site's identity and stays unprefixed for existing
// links/bookmarks (rewritten internally to /sw/... with no visible URL
// change). English/Arabic require an explicit /en or /ar prefix.
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
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
