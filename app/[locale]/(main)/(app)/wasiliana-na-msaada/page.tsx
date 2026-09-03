import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getDictionary } from "@/app/[locale]/dictionaries";
import ContactForm from "@/components/ContactForm";
import LocaleLink from "@/components/LocaleLink";
import { MailIcon, PhoneCallIcon, ClockIcon } from "@/components/icons";

// Same contact info + support form as the public Msaada page (reuses the
// same dictionary data and ContactForm component) — stays inside the
// sidebar app shell instead of bouncing a logged-in user out to the
// marketing page.
export default async function ContactSupportPage() {
  const viewerId = await getSessionUserId();
  const [dict, viewer] = await Promise.all([
    getDictionary(),
    viewerId
      ? prisma.user.findUnique({ where: { id: viewerId }, select: { name: true, email: true, phone: true } })
      : null,
  ]);
  const t = dict.msaada;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-navy">{t.contactHeading}</h1>
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

      <div className="mt-8 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-navy">{t.contactFormHeading}</h2>
        <p className="mt-1 text-sm text-neutral-600">{t.contactFormSubtitle}</p>
        <div className="mt-6">
          <ContactForm
            dict={t.contactForm}
            loggedIn={!!viewer}
            initialName={viewer?.name ?? ""}
            initialEmail={viewer?.email ?? ""}
            initialPhone={viewer?.phone ?? ""}
            myRequestsHref="/wasiliana-na-msaada/maombi-yangu"
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-black/5 bg-white p-6 text-center shadow-sm">
        <h2 className="text-sm font-semibold text-navy">{t.helpCenter.heading}</h2>
        <p className="mt-1 text-sm text-neutral-600">{t.helpCenter.intro}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <LocaleLink
            href="/maswali"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-navy hover:bg-blush-50"
          >
            {t.helpCenter.faq}
          </LocaleLink>
          <LocaleLink
            href="/kituo-cha-usalama"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-navy hover:bg-blush-50"
          >
            {t.helpCenter.safetyCenter}
          </LocaleLink>
          <LocaleLink
            href="/masharti-ya-matumizi"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-navy hover:bg-blush-50"
          >
            {t.helpCenter.terms}
          </LocaleLink>
        </div>
      </div>
    </div>
  );
}
