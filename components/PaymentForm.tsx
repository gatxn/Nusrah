"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/app/[locale]/dictionaries";

const PROVIDERS = [
  { value: "Airtel", labelKey: "providerAirtel" },
  { value: "Tigo", labelKey: "providerTigo" },
  { value: "Halopesa", labelKey: "providerHalopesa" },
  { value: "Azampesa", labelKey: "providerAzampesa" },
  { value: "Mpesa", labelKey: "providerMpesa" },
] as const;

const STATUS_POLL_MS = 3000;

function formatTzs(amount: number) {
  return new Intl.NumberFormat("sw-TZ").format(amount);
}

export default function PaymentForm({
  orderId,
  amountTzs,
  dict,
}: {
  orderId: string;
  amountTzs: number;
  dict: Dictionary["malipo"];
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]["value"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [notice, setNotice] = useState<{ type: "error" | "pending"; text: string } | null>(null);

  // Once the payment prompt is sent, poll this order's status — AzamPay's
  // MNO Checkout pushes the confirmation prompt straight to the customer's
  // phone rather than redirecting through a hosted checkout page, so there's
  // no redirect-back to land on; this page has to notice the result itself.
  const cancelledRef = useRef(false);
  useEffect(() => {
    if (!waiting) return;
    cancelledRef.current = false;
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const json = await res.json();
        if (cancelledRef.current || !res.ok) return;
        if (json.status === "PAID" || json.status === "FAILED") {
          window.location.reload();
        }
      } catch {
        // ignore — retried on the next tick
      }
    }, STATUS_POLL_MS);
    return () => {
      cancelledRef.current = true;
      window.clearInterval(interval);
    };
  }, [waiting, orderId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);

    if (!phoneNumber.trim()) {
      setNotice({ type: "error", text: dict.phoneRequired });
      return;
    }
    if (!provider) {
      setNotice({ type: "error", text: dict.providerRequired });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phoneNumber, provider }),
      });
      const json = await res.json();

      if (res.status === 503 && json.reason === "GATEWAY_NOT_CONFIGURED") {
        setNotice({ type: "pending", text: dict.pendingSetupNotice });
        return;
      }
      if (!res.ok) {
        setNotice({ type: "error", text: json.error ?? dict.genericError });
        return;
      }
      setWaiting(true);
    } catch {
      setNotice({ type: "error", text: dict.networkError });
    } finally {
      setLoading(false);
    }
  }

  if (waiting) {
    return (
      <div className="space-y-3 text-center">
        <h2 className="text-lg font-semibold text-navy">{dict.waitingHeading}</h2>
        <p className="text-sm text-neutral-600">{dict.waitingBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-center text-sm text-neutral-600">{dict.secureNotice}</p>

      {notice && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            notice.type === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"
          }`}
        >
          {notice.text}
        </p>
      )}

      <div>
        <label htmlFor="payment-phone" className="mb-1 block text-sm font-medium text-navy">
          {dict.phoneNumberLabel}
        </label>
        <input
          id="payment-phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={dict.phoneNumberPlaceholder}
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-navy">{dict.providerLabel}</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setProvider(p.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                provider === p.value
                  ? "border-primary bg-blush-50 text-primary"
                  : "border-black/10 text-neutral-600 hover:border-primary/50"
              }`}
            >
              {dict[p.labelKey]}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? dict.submitting : `${dict.payButton} — ${formatTzs(amountTzs)} TZS`}
      </button>
    </form>
  );
}
