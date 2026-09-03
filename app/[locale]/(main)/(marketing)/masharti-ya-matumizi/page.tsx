import { getDictionary } from "@/app/[locale]/dictionaries";

// The dictionary JSON's "sections[].blocks" array is heterogeneous by
// design (paragraphs, lists, subheadings, one contact block per section 32),
// but importing JSON widens each block's "type" field to plain `string`, so
// TypeScript can't narrow the union on `block.type === "p"` without this
// explicit local shape asserted at the read site.
type TermsBlock =
  | { type: "p"; text: string }
  | { type: "subheading"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "contact"; website: string; email: string; phone: string };

export default async function TermsOfUsePage() {
  const dict = await getDictionary();
  const t = dict.mashartiYaMatumizi;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t.pageEyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">{t.pageTitle}</h1>
        <p className="mt-2 text-neutral-600">{t.pageSubtitle}</p>
        <p className="mt-4 text-sm text-neutral-500">{t.effectiveDate}</p>
      </div>

      <p className="mt-10 leading-relaxed text-neutral-700">{t.intro1}</p>
      <p className="mt-4 leading-relaxed text-neutral-700">{t.intro2}</p>

      <div className="mt-10 space-y-10 [&_li]:leading-relaxed [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:ps-5 [&_p]:leading-relaxed [&_p]:text-neutral-700 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:ps-5">
        {t.sections.map((section) => (
          <section key={section.heading} className="border-t border-black/5 pt-8">
            <h2 className="mb-3 text-xl font-semibold text-navy">{section.heading}</h2>
            {(section.blocks as TermsBlock[]).map((block, i) => {
              if (block.type === "p") return <p key={i}>{block.text}</p>;
              if (block.type === "subheading") return <p key={i} className="font-semibold text-navy">{block.text}</p>;
              if (block.type === "ul")
                return (
                  <ul key={i}>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                );
              if (block.type === "ol")
                return (
                  <ol key={i}>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                );
              return (
                <p key={i}>
                  Nusrah.co.tz
                  <br />
                  {t.contactWebsiteLabel}: {block.website}
                  <br />
                  {t.contactEmailLabel}: {block.email}
                  <br />
                  {t.contactPhoneLabel}: {block.phone}
                </p>
              );
            })}
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-blush-200 bg-blush-50 p-6 text-center">
        <p className="font-heading text-lg font-semibold text-navy">Nusrah</p>
        <p className="mt-1 text-sm text-neutral-600">{t.footerTagline}</p>
        <p className="mt-3 text-sm text-neutral-600">{t.footerBody}</p>
      </div>
    </div>
  );
}
