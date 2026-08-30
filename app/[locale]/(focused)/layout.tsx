import MinimalHeader from "@/components/MinimalHeader";
import { getDictionary, getLocale } from "../dictionaries";

// Focused single-task views: no site nav, no footer, no competing links —
// just the header (logo + close) and the task itself. Nav is genuinely
// absent from the DOM here (not hidden via CSS), so there's nothing to trip
// up tab order, and a direct link to a route in this group never flashes
// the full nav first since this is resolved server-side.
export default async function FocusedLayout({ children }: { children: React.ReactNode }) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <div className="focused-enter bg-mosque-pattern flex min-h-full flex-1 flex-col">
      <MinimalHeader dict={dict.common} locale={locale} />
      <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
