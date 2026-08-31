"use client";

import { useRef, useState, type FormEvent } from "react";
import LocaleLink from "@/components/LocaleLink";
import { SUPPORT_CATEGORIES, SUPPORT_CATEGORY_LABELS, type SupportCategory } from "@/lib/support";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function ContactForm({
  dict,
  loggedIn = false,
  initialName = "",
  initialEmail = "",
  initialPhone = "",
}: {
  dict: Dictionary["msaada"]["contactForm"];
  loggedIn?: boolean;
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [category, setCategory] = useState<SupportCategory | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    if (category) formData.set("category", category);
    const file = fileInputRef.current?.files?.[0];
    if (file) formData.append("attachment", file);

    try {
      const res = await fetch("/api/contact", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? dict.genericError);
        setStatus("error");
        return;
      }
      setTicketNumber(json.ticketNumber ?? null);
      setStatus("sent");
      form.reset();
    } catch {
      setError(dict.networkError);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl bg-green-50 p-6 text-center">
        <p className="text-lg font-bold text-navy">{dict.ticketReceivedHeading}</p>
        {ticketNumber && (
          <p className="mt-2 text-sm text-neutral-700">
            {dict.ticketNumberLabel} <span className="font-mono font-semibold">{ticketNumber}</span>
          </p>
        )}
        <p className="mt-2 text-sm text-neutral-600">&ldquo;{dict.ticketReceivedBody}&rdquo;</p>
        {loggedIn && (
          <LocaleLink
            href="/msaada/maombi-yangu"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            {dict.viewMyRequests}
          </LocaleLink>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-navy">{dict.userInfoHeading}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-navy">{dict.name}</label>
            <input
              id="name"
              name="name"
              required
              minLength={2}
              defaultValue={initialName}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">{dict.email}</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={initialEmail}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-navy">{dict.phone}</label>
          <input
            id="phone"
            name="phone"
            defaultValue={initialPhone}
            placeholder={dict.phonePlaceholder}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-navy">{dict.categoryHeading}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{dict.categorySubheading}</p>
        <div className="mt-2 space-y-1.5">
          {SUPPORT_CATEGORIES.map((c) => (
            <label key={c} className="flex items-center gap-2.5 text-sm text-neutral-700">
              <input
                type="radio"
                name="category"
                value={c}
                checked={category === c}
                onChange={() => setCategory(c)}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              {SUPPORT_CATEGORY_LABELS[c]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="mb-1 block text-sm font-medium text-navy">{dict.subject}</label>
        <input
          id="subject"
          name="subject"
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="body" className="mb-1 block text-sm font-medium text-navy">{dict.body}</label>
        <textarea
          id="body"
          name="body"
          required
          minLength={5}
          rows={4}
          placeholder={dict.bodyPlaceholder}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-neutral-500">{dict.sensitiveWarning}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-navy">{dict.attachmentHeading}</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-navy hover:bg-blush-50"
        >
          {fileName ?? dict.attachmentUploadLabel}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        <p className="mt-1 text-xs text-neutral-500">{dict.attachmentHelp}</p>
      </div>

      <div className="rounded-lg bg-red-50 px-3.5 py-3 text-xs text-red-700">
        <p className="font-semibold">{dict.safetyHeading}</p>
        <p className="mt-1">{dict.safetyBody}</p>
        <LocaleLink
          href="/wanachama"
          className="mt-2 inline-block rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          {dict.reportUserButton}
        </LocaleLink>
        <p className="mt-2">{dict.emergencyNote}</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {status === "loading" ? dict.submitting : dict.submit}
      </button>
    </form>
  );
}
