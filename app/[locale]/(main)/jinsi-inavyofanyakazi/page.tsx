import { prisma } from "@/lib/db";
import { serializePackage } from "@/lib/packages";
import { TIER_RANK, isTier } from "@/lib/tiers";
import TrustBadgeBar from "@/components/TrustBadgeBar";
import TierBadge from "@/components/TierBadge";
import {
  PersonIcon,
  DocumentIcon,
  SearchIcon,
  ChatIcon,
  ShieldCheckIcon,
  HeartHandIcon,
  ArrowRightIcon,
  LockIcon,
  CheckIcon,
  ClockIcon,
} from "@/components/icons";
import { getDictionary } from "../../dictionaries";

const STEP_ICONS = [PersonIcon, DocumentIcon, SearchIcon, ChatIcon, ShieldCheckIcon, HeartHandIcon];
const TRUST_ICONS = [<ShieldCheckIcon key="a" />, <HeartHandIcon key="b" />, <LockIcon key="c" />, <ClockIcon key="d" />];

export default async function HowItWorksPage() {
  const [packagesRaw, dict] = await Promise.all([prisma.package.findMany(), getDictionary()]);
  const t = dict.jinsiInavyofanyakazi;
  const packages = packagesRaw
    .map(serializePackage)
    .sort((a, b) => (isTier(a.tier) ? TIER_RANK[a.tier] : 0) - (isTier(b.tier) ? TIER_RANK[b.tier] : 0));

  return (
    <div className="bg-hero-photo">
      <section className="px-4 py-14 text-center sm:px-6">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">{t.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600">{t.subtitle}</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.steps.map((step, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <div key={step.title} className="relative rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-bold text-primary/60">{`0${i + 1}`}</span>
                </div>
                <h3 className="mt-4 font-semibold text-navy">{step.title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{step.desc}</p>
                {i < t.steps.length - 1 && (
                  <ArrowRightIcon className="absolute end-[-12px] top-1/2 hidden h-6 w-6 -translate-y-1/2 text-primary/30 rtl:rotate-180 lg:block" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-blush-50 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">{t.tiersHeading}</h2>
            <p className="mt-2 text-neutral-600">{t.tiersSubtitle}</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {packages.map((pkg) => (
              <div key={pkg.tier} className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 text-center shadow-sm">
                <TierBadge tier={pkg.tier} freeLabel={dict.kuwaMwanachama.pricingCard.free} className="mx-auto" />
                <p className="text-sm text-neutral-600">{pkg.tagline}</p>
                <ul className="mt-2 space-y-1.5 text-start text-xs text-neutral-600">
                  {pkg.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TrustBadgeBar
        badges={t.trustBadges.map((label, i) => ({ icon: TRUST_ICONS[i], label }))}
      />
    </div>
  );
}
