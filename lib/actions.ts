"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearSessionCookie } from "@/lib/auth";
import { hasLocale, DEFAULT_LOCALE } from "@/app/[locale]/dictionaries";
import { localeHref } from "@/lib/i18n/href";

export async function logoutAction() {
  // next/root-params's locale() only works within a route's own render, not
  // inside a Server Action — read the same NEXT_LOCALE cookie proxy.ts sets
  // on every request instead (the same source app routes/API code use).
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = cookieLocale && hasLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  await clearSessionCookie();
  redirect(localeHref(locale, "/"));
}
