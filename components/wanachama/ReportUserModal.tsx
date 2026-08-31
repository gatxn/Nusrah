"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { REPORT_REASONS, REPORT_REASON_LABELS, type ReportReason } from "@/lib/reports";
import { FlagIcon } from "@/components/icons";

export default function ReportUserModal({ userId, userName }: { userId: string; userName: string }) {
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
        setError(json.error ?? "Hitilafu imetokea");
        setLoading(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Imeshindwa kuunganisha na seva. Jaribu tena.");
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
        <FlagIcon className="h-3.5 w-3.5" /> Ripoti Mtumiaji
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-7">
            {!submitted ? (
              <>
                <h2 className="text-lg font-bold text-navy">Ripoti Mtumiaji kwa Usalama wa Nusrah</h2>

                <div className="mt-3 rounded-lg bg-blush-50 px-3.5 py-2.5 text-sm">
                  <p className="text-neutral-700">
                    Unaripoti: <span className="font-semibold text-navy">{userName}</span>
                  </p>
                  <Link href={`/wanachama/${userId}`} target="_blank" className="text-primary hover:underline">
                    View Profile
                  </Link>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-navy">Kwa nini unamripoti mtumiaji huyu?</p>
                  <p className="mt-0.5 text-xs text-neutral-500">Chagua sababu inayofaa:</p>
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
                        {REPORT_REASON_LABELS[r]}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <label htmlFor="report-description" className="text-sm font-semibold text-navy">
                    📝 Eleza kilichotokea
                  </label>
                  <textarea
                    id="report-description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Andika maelezo ya tatizo hapa..."
                    className="mt-1.5 w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Tafadhali usijumuishe password, PIN, OTP au taarifa nyingine nyeti.
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-navy">📎 Ongeza Ushahidi — Hiari</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-navy hover:bg-blush-50"
                  >
                    {fileName ?? "+ Upload Screenshot"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Unaweza kuongeza screenshots za mazungumzo, profile au taarifa inayohusiana na report.
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-navy">🚫 Zuia Mtumiaji</p>
                  <label className="mt-1.5 flex items-start gap-2.5 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={blockAfterSubmit}
                      onChange={(e) => setBlockAfterSubmit(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 text-primary focus:ring-primary"
                    />
                    Block this user after submitting the report
                  </label>
                  <p className="mt-1 text-xs text-neutral-500">
                    Mtumiaji hatapokea taarifa kuhusu nani aliyemreport, isipokuwa pale inapohitajika kwa sababu za
                    kisheria au kiusalama.
                  </p>
                </div>

                <div className="mt-5 rounded-lg bg-blush-50 px-3.5 py-3 text-xs text-neutral-600">
                  <p className="font-semibold text-navy">🔐 Faragha na Usalama</p>
                  <p className="mt-1">
                    Nusrah itapitia taarifa yako kwa mujibu wa Safety Policy, Terms of Use na Privacy Policy. Kufanya
                    report hakumaanishi moja kwa moja kwamba akaunti itafungwa; hatua itategemea matokeo ya uchunguzi.
                  </p>
                </div>

                <div className="mt-3 rounded-lg bg-red-50 px-3.5 py-3 text-xs text-red-700">
                  <p className="font-semibold">🚨 Ikiwa Uko Katika Hatari ya Haraka</p>
                  <p className="mt-1">
                    Usisubiri majibu ya Nusrah. Tafuta msaada kutoka kwa mtu unayemwamini na mamlaka za dharura
                    zinazohusika.
                  </p>
                </div>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-blush-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || loading}
                    className="flex-1 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {loading ? "Inatuma..." : "🚩 Submit Report"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-3xl">✓</p>
                <h2 className="mt-2 text-lg font-bold text-navy">Report Received</h2>
                <p className="mt-2 text-sm text-neutral-600">
                  &ldquo;Asante kwa kutusaidia kulinda jamii ya Nusrah. Timu yetu itapitia taarifa yako na kuchukua
                  hatua stahiki.&rdquo;
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    href="/usalama"
                    className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                  >
                    Rudi Kwenye Safety Center
                  </Link>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-blush-50"
                  >
                    Funga
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
