"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocaleLink from "@/components/LocaleLink";
import TierBadge from "@/components/TierBadge";
import { CheckIcon } from "@/components/icons";
import type { SerializedPackage } from "@/lib/packages";
import type { Dictionary } from "@/app/[locale]/dictionaries";

function formatTzs(amount: number) {
  return new Intl.NumberFormat("sw-TZ").format(amount);
}

export default function PricingCard({
  pkg,
  isLoggedIn,
  highlighted = false,
  dict,
}: {
  pkg: SerializedPackage;
  isLoggedIn: boolean;
  highlighted?: boolean;
  dict: Dictionary["kuwaMwanachama"]["pricingCard"];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonLabel =
    dict.buttonLabels[pkg.tier as keyof typeof dict.buttonLabels] ?? dict.buttonLabels.default;

  async function handleChoose() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageTier: pkg.tier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? dict.genericError);
        return;
      }
      if (data.activated) {
        router.push("/akaunti?activated=1");
      } else {
        router.push(`/malipo/${data.orderId}`);
      }
    } catch {
      setError(dict.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 shadow-sm ${
        highlighted ? "border-primary ring-2 ring-primary/20" : "border-black/5"
      } bg-white`}
    >
      <TierBadge tier={pkg.tier} freeLabel={dict.free} className="self-start" />
      <p className="mt-4 text-3xl font-bold text-navy">
        {pkg.priceTzs === 0 ? dict.free : `${formatTzs(pkg.priceTzs)} TZS`}
        {pkg.priceTzs > 0 && <span className="text-sm font-normal text-neutral-500">{dict.perMonth}</span>}
      </p>
      <p className="mt-2 text-sm text-neutral-600">{pkg.tagline}</p>

      <ul className="mt-5 flex-1 space-y-2.5">
        {pkg.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {f}
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {isLoggedIn ? (
        <button
          type="button"
          onClick={handleChoose}
          disabled={loading}
          className={`mt-6 w-full rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
            highlighted
              ? "bg-primary text-white hover:bg-primary-dark"
              : "border border-primary text-primary hover:bg-blush-50"
          }`}
        >
          {loading ? dict.submitting : buttonLabel}
        </button>
      ) : (
        <LocaleLink
          href={`/jisajili?package=${pkg.tier}`}
          className={`mt-6 block w-full rounded-full px-5 py-2.5 text-center text-sm font-semibold transition ${
            highlighted
              ? "bg-primary text-white hover:bg-primary-dark"
              : "border border-primary text-primary hover:bg-blush-50"
          }`}
        >
          {buttonLabel}
        </LocaleLink>
      )}
    </div>
  );
}
