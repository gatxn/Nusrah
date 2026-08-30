"use client";

import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function ContactForm({ dict }: { dict: Dictionary["msaada"]["contactForm"] }) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? dict.genericError);
        setStatus("error");
        return;
      }
      setStatus("sent");
      form.reset();
    } catch {
      setError(dict.networkError);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="rounded-xl bg-green-50 p-4 text-sm text-green-700">{dict.success}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-navy">{dict.name}</label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
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
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
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
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
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
