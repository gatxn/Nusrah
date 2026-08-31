import { getDictionary } from "../../dictionaries";

export default async function SafetyCenterPage() {
  const dict = await getDictionary();
  const t = dict.usalama;

  return (
    <div className="bg-hero-photo mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t.title}</p>
        <h1 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">{t.subtitle}</h1>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-neutral-600">{t.intro}</p>
      </div>

      <div className="mt-10 space-y-6">
        {t.sections.map((section) => (
          <section key={section.heading} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
            <h2 className="flex items-center gap-2.5 text-lg font-semibold text-navy">
              <span aria-hidden="true">{section.icon}</span>
              {section.heading}
            </h2>

            {"intro" in section &&
              section.intro?.map((p, i) => (
                <p key={i} className="mt-3 leading-relaxed text-neutral-700">
                  {p}
                </p>
              ))}

            {"items" in section && section.items && (
              "ordered" in section && section.ordered ? (
                <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-neutral-700">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              ) : (
                <ul className="mt-3 list-disc space-y-1.5 ps-5 text-neutral-700">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )
            )}

            {"outro" in section &&
              section.outro?.map((p, i) => (
                <p key={i} className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {p}
                </p>
              ))}

            {"note" in section && section.note && (
              <p className="mt-4 rounded-xl bg-blush-50 px-4 py-3 text-sm font-medium text-primary-dark">
                {section.note}
              </p>
            )}
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
        <h2 className="text-lg font-semibold text-navy">{t.quickActions.heading}</h2>
        <p className="mt-1 text-sm text-neutral-600">{t.quickActions.intro}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {t.quickActions.items.map((action) => (
            <div key={action.label} className="flex items-start gap-3 rounded-xl border border-black/5 bg-blush-50 p-4">
              <span className="text-xl" aria-hidden="true">
                {action.icon}
              </span>
              <div>
                <p className="text-sm font-bold text-navy">{action.label}</p>
                <p className="mt-0.5 text-sm text-neutral-600">{action.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-blush-200 bg-blush-50 p-6 text-center sm:p-8">
        <p className="text-xl">❤️</p>
        <p className="mt-2 text-lg font-semibold text-navy">&ldquo;{t.closing.quote}&rdquo;</p>
        <p className="mt-2 text-sm text-neutral-600">{t.closing.body}</p>
      </div>
    </div>
  );
}
