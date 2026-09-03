import LocaleLink from "@/components/LocaleLink";
import { getDictionary } from "@/app/[locale]/dictionaries";
import type { Tier } from "@/lib/tiers";
import { SparkleIcon } from "@/components/icons";

export default async function UpgradeCard({ tier }: { tier: Tier }) {
  if (tier === "PREMIUM") return null;
  const dict = await getDictionary();
  const t = dict.common.upgradeCard;

  return (
    <LocaleLink
      href="/boresha-kifurushi"
      className="block rounded-xl bg-gradient-to-br from-blush-50 to-blush-100 p-3.5 transition hover:brightness-[1.03]"
    >
      <div className="flex items-center gap-2 text-primary-dark">
        <SparkleIcon className="h-4.5 w-4.5" />
        <span className="text-sm font-bold">{t.heading}</span>
      </div>
      <p className="mt-1 text-xs leading-snug text-neutral-600">{t.body}</p>
    </LocaleLink>
  );
}
