import { prisma } from "@/lib/db";
import { serializePackage } from "@/lib/packages";
import { TIER_RANK, isTier } from "@/lib/tiers";
import { getSessionUserId } from "@/lib/auth";
import PricingCard from "@/components/PricingCard";
import { getDictionary } from "../../dictionaries";

export default async function MembershipPage() {
  const [packagesRaw, userId, dict] = await Promise.all([
    prisma.package.findMany(),
    getSessionUserId(),
    getDictionary(),
  ]);
  const t = dict.kuwaMwanachama;

  const packages = packagesRaw
    .map(serializePackage)
    .sort((a, b) => (isTier(a.tier) ? TIER_RANK[a.tier] : 0) - (isTier(b.tier) ? TIER_RANK[b.tier] : 0));

  return (
    <div className="bg-hero-photo mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">{t.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600">{t.subtitle}</p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {packages.map((pkg) => (
          <PricingCard
            key={pkg.tier}
            pkg={pkg}
            isLoggedIn={Boolean(userId)}
            highlighted={pkg.tier === "GOLD"}
            dict={t.pricingCard}
          />
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-neutral-500">{t.footnote}</p>
    </div>
  );
}
