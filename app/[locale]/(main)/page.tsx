import { getSessionUserId } from "@/lib/auth";
import HeroAnimated from "@/components/HeroAnimated";
import StatsBar from "@/components/home/StatsBar";
import FeatureGrid from "@/components/home/FeatureGrid";
import QuoteCtaSection from "@/components/home/QuoteCtaSection";
import { getDictionary } from "../dictionaries";

export default async function HomePage() {
  const [loggedIn, dict] = await Promise.all([
    getSessionUserId().then(Boolean),
    getDictionary(),
  ]);

  return (
    <div className="bg-hero-photo">
      <HeroAnimated loggedIn={loggedIn} dict={dict.home} />
      <StatsBar items={dict.home.statsBar} />
      <FeatureGrid items={dict.home.features} />
      <QuoteCtaSection loggedIn={loggedIn} dict={dict.home} />
    </div>
  );
}
