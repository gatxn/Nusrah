"use client";

import { useState } from "react";
import type { Dictionary } from "@/app/[locale]/dictionaries";
import PaymentForm from "@/components/PaymentForm";
import PayPalCheckoutButton from "@/components/PayPalCheckoutButton";

// PayPal is offered alongside AzamPay's mobile money, not replacing it — a
// member without a card/PayPal balance still has a working payment path.
export default function PaymentMethodPicker({
  orderId,
  amountTzs,
  amountUsdCents,
  dict,
}: {
  orderId: string;
  amountTzs: number;
  amountUsdCents: number | null;
  dict: Dictionary["malipo"];
}) {
  const [method, setMethod] = useState<"mobile" | "paypal">("mobile");

  if (amountUsdCents == null) {
    return <PaymentForm orderId={orderId} amountTzs={amountTzs} dict={dict} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex rounded-full border border-black/10 p-1">
        <button
          type="button"
          onClick={() => setMethod("mobile")}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
            method === "mobile" ? "bg-primary text-white" : "text-neutral-600"
          }`}
        >
          {dict.methodMobileMoney}
        </button>
        <button
          type="button"
          onClick={() => setMethod("paypal")}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
            method === "paypal" ? "bg-primary text-white" : "text-neutral-600"
          }`}
        >
          {dict.methodPaypal}
        </button>
      </div>

      {method === "mobile" ? (
        <PaymentForm orderId={orderId} amountTzs={amountTzs} dict={dict} />
      ) : (
        <PayPalCheckoutButton orderId={orderId} amountUsdCents={amountUsdCents} dict={dict} />
      )}
    </div>
  );
}
