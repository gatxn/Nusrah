"use client";

import { useRef, useState } from "react";
import LocaleLink from "@/components/LocaleLink";
import { REPORT_REASONS, type ReportReason } from "@/lib/reports";
import { FlagIcon } from "@/components/icons";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function ReportUserModal({
  userId,
  userName,
  dict,
  reasons,
}: {
  userId: string;
  userName: string;
  dict: Dictionary["ripotiMtumiaji"]["modal"];
  reasons: Dictionary["common"]["reportReasons"];
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [blockAfterSubmit, setBlockAfterSubmit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setSubmitted(false);
    setReason("");
    setDescription("");
    setBlockAfterSubmit(true);
    setFileName(null);
    setError(null);
  }

  async function handleSubmit() {
    if (!reason || description.trim().length < 10) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("reportedUserId", userId);
      formData.append("reason", reason);
      formData.append("description", description);
      formData.append("blockAfterSubmit", String(blockAfterSubmit));
      const file = fileInputRef.current?.files?.[0];
      if (file) formData.append("evidence", file);

      const res = await fetch("/api/reports", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? dict.genericError);
        setLoading(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError(dict.networkError);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !!reason && description.trim().length >= 10;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-red-600"
      >
        <FlagIcon className="h-3.5 w-3.5" /> {dict.triggerButton}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-7">
            {!submitted ? (
              <>
                <h2 className="text-lg font-bold text-navy">{dict.heading}</h2>

                <div className="mt-3 rounded-lg bg-blush-50 px-3.5 py-2.5 text-sm">
                  <p className="text-neutral-700">
                    {dict.reportingPrefix} <span className="font-semibold text-navy">{userName}</span>
                  </p>
                  <LocaleLink href={`/wanachama/${userId}`} target="_blank" className="text-primary hover:underline">
                    {dict.viewProfile}
                  </LocaleLink>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-navy">{dict.reasonQuestion}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{dict.reasonHint}</p>
                  <div className="mt-2 space-y-1.5">
                    {REPORT_REASONS.map((r) => (
                      <label key={r} className="flex items-center gap-2.5 text-sm text-neutral-700">
                        <input
                          type="radio"
                          name="reason"
                          value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="h-4 w-4 text-primary focus:ring-primary"
                        />
                        {reasons[r]}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <label htmlFor="report-description" className="text-sm font-semibold text-navy">
                    {dict.descriptionLabel}
                  </label>
                  <textarea
                    id="report-description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={dict.descriptionPlaceholder}
                    className="mt-1.5 w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-neutral-500">{dict.descriptionHint}</p>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-navy">{dict.evidenceLabel}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-navy hover:bg-blush-50"
                  >
                    {fileName ?? dict.uploadScreenshot}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  />
                  <p className="mt-1 text-xs text-neutral-500">{dict.evidenceHint}</p>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-navy">{dict.blockLabel}</p>
                  <label className="mt-1.5 flex items-start gap-2.5 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={blockAfterSubmit}
                      onChange={(e) => setBlockAfterSubmit(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 text-primary focus:ring-primary"
                    />
                    {dict.blockCheckboxLabel}
                  </label>
                  <p className="mt-1 text-xs text-neutral-500">{dict.blockHint}</p>
                </div>

                <div className="mt-5 rounded-lg bg-blush-50 px-3.5 py-3 text-xs text-neutral-600">
                  <p className="font-semibold text-navy">{dict.privacyTitle}</p>
                  <p className="mt-1">{dict.privacyBody}</p>
                </div>

                <div className="mt-3 rounded-lg bg-red-50 px-3.5 py-3 text-xs text-red-700">
                  <p className="font-semibold">{dict.emergencyTitle}</p>
                  <p className="mt-1">{dict.emergencyBody}</p>
                </div>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-blush-50"
                  >
                    {dict.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    className="flex-1 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {loading ? dict.submitting : dict.submitButton}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-3xl">{dict.successCheckmark}</p>
                <h2 className="mt-2 text-lg font-bold text-navy">{dict.successHeading}</h2>
                <p className="mt-2 text-sm text-neutral-600">&ldquo;{dict.successBody}&rdquo;</p>
                <div className="mt-5 flex flex-col gap-2">
                  <LocaleLink
                    href="/kituo-cha-usalama"
                    className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                  >
                    {dict.backToSafety}
                  </LocaleLink>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-blush-50"
                  >
                    {dict.close}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
