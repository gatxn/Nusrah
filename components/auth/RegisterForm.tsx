"use client";

import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { withLocale } from "@/lib/i18n/href";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function RegisterForm({
  initialPackage,
  dict,
}: {
  initialPackage?: string;
  dict: Dictionary["jisajili"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState<"FEMALE" | "MALE">("FEMALE");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, gender }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? dict.genericError);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({ userId: json.userId });
      if (json.devCode) params.set("devCode", json.devCode);
      if (initialPackage) params.set("package", initialPackage);
      router.push(withLocale(pathname, `/thibitisha?${params.toString()}`));
    } catch {
      setError(dict.networkError);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-navy">{dict.form.name}</label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          placeholder={dict.form.namePlaceholder}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-navy">{dict.form.phone}</label>
        <input
          id="phone"
          name="phone"
          required
          placeholder={dict.form.phonePlaceholder}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">{dict.form.email}</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder={dict.form.emailPlaceholder}
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
          minLength={8}
          placeholder={dict.form.passwordPlaceholder}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-navy">{dict.form.gender}</span>
        <div className="flex gap-3">
          {(["FEMALE", "MALE"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                gender === g ? "border-primary bg-blush-50 text-primary" : "border-black/10 text-neutral-600"
              }`}
            >
              {g === "FEMALE" ? dict.form.female : dict.form.male}
            </button>
          ))}
        </div>
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
