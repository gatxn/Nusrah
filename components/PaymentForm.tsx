"use client";

import { useState, type FormEvent } from "react";

const METHODS = [
  { id: "mpesa", label: "M-Pesa" },
  { id: "tigopesa", label: "Tigo Pesa" },
  { id: "airtelmoney", label: "Airtel Money" },
];

function formatTzs(amount: number) {
  return new Intl.NumberFormat("sw-TZ").format(amount);
}

export default function PaymentForm({ orderId, amountTzs }: { orderId: string; amountTzs: number }) {
  const [method, setMethod] = useState("mpesa");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "error" | "pending"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phoneNumber: phone }),
      });
      const json = await res.json();

      if (res.status === 503 && json.reason === "GATEWAY_NOT_CONFIGURED") {
        setNotice({ type: "pending", text: json.error });
        return;
      }
      if (!res.ok) {
        setNotice({ type: "error", text: json.error ?? "Hitilafu imetokea" });
        return;
      }
      // Reachable only once a real gateway is wired in.
      setNotice({ type: "pending", text: "Fuata maelekezo kwenye simu yako kukamilisha malipo." });
    } catch {
      setNotice({ type: "error", text: "Imeshindwa kuunganisha na seva. Jaribu tena." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <span className="mb-2 block text-sm font-medium text-navy">Chagua Njia ya Malipo</span>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                method === m.id ? "border-primary bg-blush-50 text-primary" : "border-black/10 text-neutral-600"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-navy">
          Namba ya Simu ya Malipo
        </label>
        <input
          id="phone"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0712345678"
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-neutral-500">Malipo yataelekezwa kwenye payment gateway.</p>
      </div>

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
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? "Inatuma..." : `Lipa ${formatTzs(amountTzs)} TZS`}
      </button>
    </form>
  );
}
