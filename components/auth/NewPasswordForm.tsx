"use client";

import { useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { withLocale } from "@/lib/i18n/href";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import type { Dictionary } from "@/app/[locale]/dictionaries";

function PasswordField({
  id,
  name,
  label,
  placeholder,
  show,
  onToggleShow,
  toggleAria,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
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
          minLength={8}
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

export default function NewPasswordForm({
  userId,
  resetToken,
  dict,
}: {
  userId: string;
  resetToken: string;
  dict: Dictionary["nenosiriJipya"];
}) {
  const pathname = usePathname();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const newPassword = formData.get("newPassword");
    const confirmNewPassword = formData.get("confirmNewPassword");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, resetToken, newPassword, confirmNewPassword }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? dict.genericError);
        setLoading(false);
        return;
      }

      // Hard navigation so the login page renders fresh with the
      // reset=1 success banner rather than a cached pre-reset render.
      window.location.href = withLocale(pathname, "/ingia?reset=1");
    } catch {
      setError(dict.networkError);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordField
        id="newPassword"
        name="newPassword"
        label={dict.form.newPassword}
        placeholder={dict.form.newPasswordPlaceholder}
        show={showPassword}
        onToggleShow={() => setShowPassword((v) => !v)}
        toggleAria={dict.form.togglePasswordAria}
      />
      <PasswordField
        id="confirmNewPassword"
        name="confirmNewPassword"
        label={dict.form.confirmNewPassword}
        placeholder={dict.form.confirmNewPasswordPlaceholder}
        show={showConfirm}
        onToggleShow={() => setShowConfirm((v) => !v)}
        toggleAria={dict.form.togglePasswordAria}
      />

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
