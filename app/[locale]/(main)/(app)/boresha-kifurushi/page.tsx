import { prisma } from "@/lib/db";
import { serializePackage } from "@/lib/packages";
import { TIER_RANK, isTier } from "@/lib/tiers";
import PricingCard from "@/components/PricingCard";
import { getDictionary } from "@/app/[locale]/dictionaries";

// Same packages + PricingCard as the public Kuwa Mwanachama page (reuses the
// same dictionary data) — stays inside the sidebar app shell instead of
// bouncing a logged-in user out to the marketing page. The viewer here is
// always logged in (this route sits under the (app) auth guard), so
// PricingCard always renders its "Choose" button, never the register link.
export default async function UpgradePackageAppPage() {
  const [packagesRaw, dict] = await Promise.all([prisma.package.findMany(), getDictionary()]);
  const t = dict.kuwaMwanachama;

  const packages = packagesRaw
    .map(serializePackage)
    .sort((a, b) => (isTier(a.tier) ? TIER_RANK[a.tier] : 0) - (isTier(b.tier) ? TIER_RANK[b.tier] : 0));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">{t.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600">{t.subtitle}</p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {packages.map((pkg) => (
          <PricingCard
            key={pkg.tier}
            pkg={pkg}
            isLoggedIn
            highlighted={pkg.tier === "GOLD"}
            dict={t.pricingCard}
          />
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-neutral-500">{t.footnote}</p>
    </div>
  );
}
