"use client";

import { useState } from "react";
import type { Dictionary } from "@/app/[locale]/dictionaries";

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
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "error" | "pending"; text: string } | null>(null);

  async function handlePay() {
    setLoading(true);
    setNotice(null);

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json();

      if (res.status === 503 && json.reason === "GATEWAY_NOT_CONFIGURED") {
        setNotice({ type: "pending", text: dict.pendingSetupNotice });
        return;
      }
      if (!res.ok || typeof json.checkoutUrl !== "string") {
        setNotice({ type: "error", text: json.error ?? dict.genericError });
        return;
      }
      // Hard navigation to the gateway's own hosted checkout page — not a
      // page this app renders, so there's nothing to route to internally.
      window.location.href = json.checkoutUrl;
    } catch {
      setNotice({ type: "error", text: dict.networkError });
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
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

      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? dict.submitting : `${dict.payButton} — ${formatTzs(amountTzs)} TZS`}
      </button>
    </div>
  );
}
