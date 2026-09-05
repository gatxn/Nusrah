import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { getLocale } from "@/app/[locale]/dictionaries";
import { localeHref } from "@/lib/i18n/href";
import HeroAnimated from "@/components/HeroAnimated";
import StatsBar from "@/components/home/StatsBar";
import FeatureGrid from "@/components/home/FeatureGrid";
import QuoteCtaSection from "@/components/home/QuoteCtaSection";
import { getDictionary } from "../../dictionaries";

export default async function HomePage() {
  const [userId, locale, dict] = await Promise.all([
    getSessionUserId(),
    getLocale(),
    getDictionary(),
  ]);
  // A logged-in visitor has no reason to see the public landing page again —
  // send them straight into the app; (app)/layout.tsx's own gate takes it
  // from there (onboarding if incomplete, Matches otherwise).
  if (userId) redirect(localeHref(locale, "/wanachama"));

  return (
    <div className="bg-hero-photo">
      <HeroAnimated dict={dict.home} />
      <StatsBar items={dict.home.statsBar} />
      <FeatureGrid items={dict.home.features} />
      <QuoteCtaSection dict={dict.home} />
    </div>
  );
}
