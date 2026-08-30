import type { NextRequest } from "next/server";

const LOCALES = ["sw", "en", "ar"] as const;
type ApiLocale = (typeof LOCALES)[number];

function isApiLocale(value: string | undefined): value is ApiLocale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

// Route Handlers aren't nested under app/[locale] and next/root-params
// doesn't reach them, so locale is read from the NEXT_LOCALE cookie proxy.ts
// sets on every page request, falling back to a manual Accept-Language
// parse, falling back to Swahili.
export function localeFromRequest(request: NextRequest): ApiLocale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (isApiLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.trim().toLowerCase();
    if (isApiLocale(preferred)) return preferred;
  }

  return "sw";
}

const dictionaries = {
  sw: () => import("@/app/[locale]/dictionaries/sw.json").then((m) => m.default),
  en: () => import("@/app/[locale]/dictionaries/en.json").then((m) => m.default),
  ar: () => import("@/app/[locale]/dictionaries/ar.json").then((m) => m.default),
};

export async function authErrors(request: NextRequest) {
  const locale = localeFromRequest(request);
  const dict = await dictionaries[locale]();
  return dict.apiErrors.auth;
}

export async function validationMessages(request: NextRequest) {
  const locale = localeFromRequest(request);
  const dict = await dictionaries[locale]();
  return dict.validation;
}
