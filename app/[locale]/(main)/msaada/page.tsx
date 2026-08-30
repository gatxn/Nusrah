import { prisma } from "@/lib/db";
import FaqAccordion from "@/components/FaqAccordion";
import ContactForm from "@/components/ContactForm";
import { StarIcon, MailIcon, PhoneCallIcon, ClockIcon } from "@/components/icons";
import { getDictionary } from "../../dictionaries";

export default async function HelpPage() {
  const [reviews, dict] = await Promise.all([
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    getDictionary(),
  ]);
  const t = dict.msaada;
  const avgRating =
    reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "4.8";

  return (
    <div className="bg-hero-photo mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">{t.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600">{t.subtitle}</p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-navy">{t.faqHeading}</h2>
          <FaqAccordion items={t.faqs} />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy">{t.contactHeading}</h2>
            <ul className="mt-4 space-y-3 text-sm text-neutral-600">
              <li className="flex items-center gap-3">
                <MailIcon className="h-4 w-4 text-primary" /> msaada@nusrah.co.tz
              </li>
              <li className="flex items-center gap-3">
                <PhoneCallIcon className="h-4 w-4 text-primary" /> +255 700 000 000 (WhatsApp)
              </li>
              <li className="flex items-center gap-3">
                <ClockIcon className="h-4 w-4 text-primary" /> {t.hours}
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-navy">{avgRating}</span>
              <div className="flex gap-0.5 text-tier-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="h-4 w-4" />
                ))}
              </div>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{t.ratingFrom}</p>
            <ul className="mt-4 space-y-3 border-t border-black/5 pt-4">
              {reviews.map((r) => (
                <li key={r.id} className="text-sm text-neutral-600">
                  &ldquo;{r.body}&rdquo;
                  <span className="mt-1 block text-xs font-medium text-navy">— {r.name}, {r.city}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-12 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-navy">{t.contactFormHeading}</h2>
        <p className="mt-1 text-sm text-neutral-600">{t.contactFormSubtitle}</p>
        <div className="mt-6">
          <ContactForm dict={t.contactForm} />
        </div>
      </div>
    </div>
  );
}
