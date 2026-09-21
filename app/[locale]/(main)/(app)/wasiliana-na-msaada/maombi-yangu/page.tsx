import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { formatDateSw } from "@/lib/dates";
import { formatTicketNumber, isSupportCategory } from "@/lib/support";
import LocaleLink from "@/components/LocaleLink";
import { getDictionary } from "@/app/[locale]/dictionaries";

// Same ticket history as the public Msaada page's version (reuses the same
// dictionary data and ContactMessage records) — stays inside the sidebar
// app shell instead of bouncing a logged-in user out to the marketing page.
export default async function MyRequestsAppPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/ingia");

  const [dict, requests] = await Promise.all([
    getDictionary(),
    prisma.contactMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const t = dict.msaada.myRequests;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t.title}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t.subtitle}</p>
      </div>

      <div className="mt-6 space-y-4">
        {requests.length === 0 ? (
          <p className="rounded-2xl border border-black/5 bg-white p-6 text-center text-sm text-neutral-500 shadow-sm">
            {t.empty}
          </p>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-navy">
                  {t.ticketNumber} {formatTicketNumber(r.ticketSeq)}
                </span>
                <span className="rounded-full bg-blush-50 px-3 py-1 text-xs font-semibold text-primary-dark">
                  {t.status}: {t.statusPending}
                </span>
              </div>
              {r.category && isSupportCategory(r.category) && (
                <p className="mt-2 text-sm text-neutral-600">{dict.common.supportCategories[r.category]}</p>
              )}
              {r.subject && <p className="mt-1 text-sm font-medium text-navy">{r.subject}</p>}
              <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{r.body}</p>
              <p className="mt-2 text-xs text-neutral-400">{formatDateSw(r.createdAt)}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 text-center">
        <LocaleLink href="/wasiliana-na-msaada" className="text-sm font-semibold text-primary hover:underline">
          ← {t.backToMsaada}
        </LocaleLink>
      </div>
    </div>
  );
}
