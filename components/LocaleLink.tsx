"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { withLocale } from "@/lib/i18n/href";

// Drop-in replacement for next/link's <Link> that keeps the current
// locale's URL prefix (en/ar) when navigating between in-scope pages —
// a plain <Link href="/jisajili"> would otherwise drop back to Swahili
// (the unprefixed default) even while browsing an /en/ or /ar/ page.
export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const pathname = usePathname();
  const target = typeof href === "string" ? withLocale(pathname, href) : href;
  return <Link href={target} {...props} />;
}
