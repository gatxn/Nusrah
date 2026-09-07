"use client";

import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { withLocale } from "@/lib/i18n/href";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function ResetOtpForm({
  userId,
  initialDevCode,
  dict,
}: {
  userId: string;
  initialDevCode?: string;
  dict: Dictionary["thibitishaNenosiri"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [code, setCode] = useState(initialDevCode ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
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

      const params = new URLSearchParams({ userId, resetToken: json.resetToken });
      router.push(withLocale(pathname, `/nenosiri-jipya?${params.toString()}`));
    } catch {
      setError(dict.networkError);
      setLoading(false);
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

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? dict.form.submitting : dict.form.submit}
      </button>
    </form>
  );
}
