"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { withLocale } from "@/lib/i18n/href";
import type { Dictionary } from "@/app/[locale]/dictionaries";

const CONFIRMATION_WORD = "FUTA";

export default function DeleteAccountModal({ dict }: { dict: Dictionary["mipangilio"]["deleteAccountModal"] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setPassword("");
    setConfirmation("");
    setError(null);
  }

  const canSubmit = password.length > 0 && confirmation === CONFIRMATION_WORD;

  async function handleDelete() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmation }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? dict.genericError);
        setLoading(false);
        return;
      }
      // Hard navigation, not router.push: this is a destroyed session —
      // avoid any reliance on the client Router Cache, same reasoning as
      // OtpForm/LoginForm/PhotoStep for auth-sensitive destinations.
      window.location.href = withLocale(pathname ?? "/", "/");
    } catch {
      setError(dict.networkError);
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        {dict.triggerButton}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-7">
            <h2 className="text-lg font-bold text-navy">{dict.modalHeading}</h2>
            <p className="mt-2 text-sm text-neutral-600">{dict.warning}</p>

            <div className="mt-4">
              <label htmlFor="delete-password" className="mb-1 block text-sm font-medium text-navy">
                {dict.passwordLabel}
              </label>
              <input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="delete-confirmation" className="mb-1 block text-sm font-medium text-navy">
                {dict.confirmationLabelPrefix} <span className="font-bold">{CONFIRMATION_WORD}</span>{" "}
                {dict.confirmationLabelSuffix}
              </label>
              <input
                id="delete-confirmation"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={close}
                className="flex-1 rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-blush-50"
              >
                {dict.cancel}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canSubmit || loading}
                className="flex-1 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? dict.deleting : dict.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
