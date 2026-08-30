"use client";

import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { withLocale } from "@/lib/i18n/href";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function LoginForm({ dict }: { dict: Dictionary["ingia"] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.requiresOtp) {
          router.push(withLocale(pathname, `/thibitisha?userId=${json.userId}`));
          return;
        }
        setError(json.error ?? dict.genericError);
        setLoading(false);
        return;
      }

      // Hard navigation (not router.push): json.redirectTo is server-computed
      // (see app/api/auth/login) and must render fresh — a client-side push
      // can land on a stale pre-auth render of the (main) layout from
      // earlier in this visit, silently skipping the onboarding gate. Its
      // target is always an out-of-scope (Swahili-only) page, so it's
      // intentionally not locale-prefixed here.
      window.location.href = json.redirectTo ?? "/wanachama";
    } catch {
      setError(dict.networkError);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="identifier" className="mb-1 block text-sm font-medium text-navy">{dict.form.identifier}</label>
        <input
          id="identifier"
          name="identifier"
          required
          autoFocus
          placeholder={dict.form.identifierPlaceholder}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy">{dict.form.password}</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? dict.form.submitting : dict.form.submit}
      </button>
    </form>
  );
}
