import { locale } from "next/root-params";
import { notFound } from "next/navigation";

export const LOCALES = ["sw", "en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "sw";
export const RTL_LOCALES: readonly Locale[] = ["ar"];

export function hasLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function dirFor(l: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.includes(l) ? "rtl" : "ltr";
}

const dictionaries = {
  sw: () => import("./dictionaries/sw.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  ar: () => import("./dictionaries/ar.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["sw"]>>;

// Locale is read directly from the route segment via next/root-params, so
// pages/components call getDictionary() with no argument — no prop-drilling
// `params.locale` through every layer of the tree.
export async function getDictionary(): Promise<Dictionary> {
  const l = await locale();
  if (!l || !hasLocale(l)) notFound();
  return dictionaries[l]();
}

// Used only where the raw locale code itself is needed (e.g. the language
// switcher, or building a `dir`/`lang` attribute) rather than translated text.
export async function getLocale(): Promise<Locale> {
  const l = await locale();
  if (!l || !hasLocale(l)) notFound();
  return l;
}
