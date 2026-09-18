"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/app/[locale]/dictionaries";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: (err: unknown) => void;
      }) => { render: (container: HTMLElement) => void };
    };
  }
}

const PAYPAL_SDK_SRC_BASE = "https://www.paypal.com/sdk/js";

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function PayPalCheckoutButton({
  orderId,
  amountUsdCents,
  dict,
}: {
  orderId: string;
  amountUsdCents: number;
  dict: Dictionary["malipo"];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "processing" | "error">(() =>
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? "loading" : "error"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function createOrder(): Promise<string> {
      const res = await fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || typeof json?.id !== "string") throw new Error(json?.error ?? dict.paypalError);
      return json.id;
    }

    async function onApprove(data: { orderID: string }) {
      setStatus("processing");
      try {
        const res = await fetch("/api/payments/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, paypalOrderId: data.orderID }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          setError(json?.error ?? dict.paypalError);
          setStatus("ready");
          return;
        }
        window.location.reload();
      } catch {
        setError(dict.paypalError);
        setStatus("ready");
      }
    }

    function renderButtons() {
      if (cancelled || !window.paypal || !containerRef.current) return;
      containerRef.current.innerHTML = "";
      window.paypal
        .Buttons({
          createOrder,
          onApprove,
          onError: () => {
            setError(dict.paypalError);
            setStatus("ready");
          },
        })
        .render(containerRef.current);
      setStatus("ready");
    }

    if (window.paypal) {
      renderButtons();
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      // Initial state already reflects "error" for this case — see useState above.
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", renderButtons);
      return () => existing.removeEventListener("load", renderButtons);
    }

    const script = document.createElement("script");
    script.src = `${PAYPAL_SDK_SRC_BASE}?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
    script.dataset.paypalSdk = "true";
    script.addEventListener("load", renderButtons);
    script.addEventListener("error", () => {
      if (!cancelled) setStatus("error");
    });
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", renderButtons);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <div className="space-y-3">
      <p className="text-center text-lg font-bold text-primary">{formatUsd(amountUsdCents)}</p>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {status === "processing" && <p className="text-center text-sm text-neutral-600">{dict.paypalProcessing}</p>}
      {status === "error" && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{dict.paypalLoadError}</p>}
      <div ref={containerRef} className={status === "processing" ? "pointer-events-none opacity-50" : ""} />
    </div>
  );
}
