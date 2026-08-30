"use client";

import { usePathname } from "next/navigation";
import LocaleLink from "@/components/LocaleLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";
import { CloseIcon } from "@/components/icons";
import { withLocale } from "@/lib/i18n/href";
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries";

/**
 * Header for focused single-task views (login, onboarding). Deliberately
 * has no nav links or CTAs: just a way out, so the user is never trapped
 * but also never re-tempted mid-task.
 *
 * On the onboarding flow specifically, "close" abandons the in-progress
 * session and starts over at registration — a plain link to "/" would just
 * bounce the user right back into onboarding (they're still authenticated
 * with an incomplete profile, and app/[locale]/(main)/layout.tsx's gate
 * would immediately redirect them there again), so this logs them out first.
 */
export default function MinimalHeader({
  dict,
  locale,
}: {
  dict: Dictionary["common"];
  locale: Locale;
}) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith(withLocale(pathname, "/onboarding"));

  if (!isOnboarding) {
    return (
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Logo tagline={dict.tagline} />
        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLocale={locale} label={dict.languageSwitcher.label} />
          <LocaleLink
            href="/"
            aria-label={dict.closeReturnHomeAria}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-black/5 hover:text-navy"
          >
            <CloseIcon className="h-5 w-5" />
          </LocaleLink>
        </div>
      </header>
    );
  }

  async function abandonOnboarding() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Hard navigation, not router.push: same reasoning as the post-auth
    // redirects in OtpForm/LoginForm — the destination is under (main),
    // whose layout gate must see the just-cleared session fresh, not a
    // cached render from before this logout.
    window.location.href = withLocale(pathname, "/jisajili");
  }

  return (
    <header className="flex items-center justify-between px-4 py-4 sm:px-6">
      <Logo tagline={dict.tagline} />
      <button
        type="button"
        onClick={abandonOnboarding}
        aria-label={dict.closeRestartSignupAria}
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-black/5 hover:text-navy"
      >
        <CloseIcon className="h-5 w-5" />
      </button>
    </header>
  );
}
