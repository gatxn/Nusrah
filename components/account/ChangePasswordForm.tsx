"use client";

import { useState, type FormEvent } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import type { Dictionary } from "@/app/[locale]/dictionaries";

function PasswordField({
  id,
  label,
  value,
  onChange,
  hideAria,
  showAria,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hideAria: string;
  showAria: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-navy">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2 pe-10 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? hideAria : showAria}
          className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-neutral-400 hover:text-neutral-600"
        >
          {show ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordForm({ dict }: { dict: Dictionary["mipangilio"]["changePasswordForm"] }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setError(dict.passwordsDoNotMatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? dict.genericError);
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      setError(dict.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordField
        id="currentPassword"
        label={dict.currentPasswordLabel}
        value={currentPassword}
        onChange={setCurrentPassword}
        hideAria={dict.hidePasswordAria}
        showAria={dict.showPasswordAria}
      />
      <PasswordField
        id="newPassword"
        label={dict.newPasswordLabel}
        value={newPassword}
        onChange={setNewPassword}
        hideAria={dict.hidePasswordAria}
        showAria={dict.showPasswordAria}
      />
      <PasswordField
        id="confirmNewPassword"
        label={dict.confirmNewPasswordLabel}
        value={confirmNewPassword}
        onChange={setConfirmNewPassword}
        hideAria={dict.hidePasswordAria}
        showAria={dict.showPasswordAria}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm font-semibold text-green-700">{dict.successMessage}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? dict.submitting : dict.submit}
      </button>
    </form>
  );
}
