import { getDictionary } from "@/app/[locale]/dictionaries";
import FaqAccordion from "@/components/FaqAccordion";
import LocaleLink from "@/components/LocaleLink";

// Same FAQ content as the public Msaada page (reuses the same dictionary
// data and FaqAccordion component) — this version stays inside the sidebar
// app shell instead of bouncing a logged-in user out to the marketing page.
export default async function FaqPage() {
  const dict = await getDictionary();
  const t = dict.msaada;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-navy">{t.faqHeading}</h1>
      <div className="mt-6">
        <FaqAccordion items={t.faqs} />
      </div>

      <div className="mt-6 rounded-2xl border border-blush-200 bg-blush-50 p-6">
        <h3 className="font-semibold text-navy">{t.safetyNote.heading}</h3>
        <p className="mt-2 text-sm text-neutral-600">{t.safetyNote.body}</p>
        <LocaleLink href="/kituo-cha-usalama" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          {t.safetyNote.linkLabel}
        </LocaleLink>
      </div>
    </div>
  );
}
