"use client";

import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function OtpForm({
  userId,
  initialDevCode,
  targetPackage,
  dict,
}: {
  userId: string;
  initialDevCode?: string;
  targetPackage?: string;
  dict: Dictionary["thibitisha"];
}) {
  const [code, setCode] = useState(initialDevCode ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? dict.genericError);
        setLoading(false);
        return;
      }

      if (targetPackage) {
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageTier: targetPackage }),
        });
        const orderJson = await orderRes.json();
        if (orderRes.ok) {
          // Hard navigation (not router.push): the destination must render
          // fresh so the onboarding gate in app/(main)/layout.tsx sees the
          // just-set session cookie, not a cached pre-auth render of that
          // shared layout from earlier in this visit.
          window.location.href = orderJson.activated ? "/akaunti?activated=1" : `/malipo/${orderJson.orderId}`;
          return;
        }
      }

      // json.redirectTo is server-computed (see app/api/auth/verify-otp) —
      // same hard-navigation reasoning as above.
      window.location.href = json.redirectTo ?? "/wanachama";
    } catch {
      setError(dict.networkError);
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? dict.genericError);
        return;
      }
      setResendMsg(json.devCode ? `${dict.resendDevPrefix} ${json.devCode}` : dict.resendSuccess);
      if (json.devCode) setCode(json.devCode);
    } catch {
      setError(dict.networkErrorShort);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="code" className="mb-1 block text-sm font-medium text-navy">{dict.form.codeLabel}</label>
        <input
          id="code"
          name="code"
          required
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-center text-2xl tracking-[0.5em] focus:border-primary focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {resendMsg && <p className="text-sm text-primary">{resendMsg}</p>}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? dict.form.submitting : dict.form.submit}
      </button>

      <button
        type="button"
        onClick={handleResend}
        className="w-full text-center text-sm font-medium text-primary hover:underline"
      >
        {dict.form.resend}
      </button>
    </form>
  );
}
