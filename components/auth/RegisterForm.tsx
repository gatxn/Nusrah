"use client";

import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { withLocale } from "@/lib/i18n/href";
import LocaleLink from "@/components/LocaleLink";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import type { Dictionary } from "@/app/[locale]/dictionaries";

function PasswordField({
  id,
  name,
  label,
  placeholder,
  minLength,
  show,
  onToggleShow,
  toggleAria,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  minLength?: number;
  show: boolean;
  onToggleShow: () => void;
  toggleAria: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-navy">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          required
          minLength={minLength}
          placeholder={placeholder}
          className="w-full rounded-lg border border-black/10 px-3 py-2 pe-10 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={toggleAria}
          aria-pressed={show}
          className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-neutral-400 hover:text-neutral-600"
        >
          {show ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
        </button>
      </div>
    </div>
  );
}

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    if (data.password !== data.confirmPassword) {
      setError(dict.form.passwordsDoNotMatch);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, gender, agreedToTerms }),
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

      <PasswordField
        id="password"
        name="password"
        label={dict.form.password}
        placeholder={dict.form.passwordPlaceholder}
        minLength={8}
        show={showPassword}
        onToggleShow={() => setShowPassword((v) => !v)}
        toggleAria={dict.form.togglePasswordAria}
      />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label={dict.form.confirmPassword}
        placeholder={dict.form.confirmPasswordPlaceholder}
        minLength={8}
        show={showConfirmPassword}
        onToggleShow={() => setShowConfirmPassword((v) => !v)}
        toggleAria={dict.form.togglePasswordAria}
      />

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

      <label className="flex items-start gap-2.5 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 text-primary focus:ring-primary"
        />
        <span>
          {dict.form.agreeToTermsPrefix}{" "}
          <LocaleLink
            href="/masharti-ya-matumizi"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline"
          >
            {dict.form.agreeToTermsLink}
          </LocaleLink>
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !agreedToTerms}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? dict.form.submitting : dict.form.submit}
      </button>
    </form>
  );
}
