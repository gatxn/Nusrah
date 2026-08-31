import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { formatDateSw } from "@/lib/dates";
import { formatTicketNumber, isSupportCategory, SUPPORT_CATEGORY_LABELS } from "@/lib/support";
import LocaleLink from "@/components/LocaleLink";
import { getDictionary } from "../../../dictionaries";

export default async function MyRequestsPage() {
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
    <div className="bg-hero-photo mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t.title}</h1>
        <p className="mt-2 text-sm text-neutral-600">{t.subtitle}</p>
      </div>

      <div className="mt-8 space-y-4">
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
                <p className="mt-2 text-sm text-neutral-600">{SUPPORT_CATEGORY_LABELS[r.category]}</p>
              )}
              {r.subject && <p className="mt-1 text-sm font-medium text-navy">{r.subject}</p>}
              <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{r.body}</p>
              <p className="mt-2 text-xs text-neutral-400">{formatDateSw(r.createdAt)}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 text-center">
        <LocaleLink href="/msaada" className="text-sm font-semibold text-primary hover:underline">
          ← {t.backToMsaada}
        </LocaleLink>
      </div>
    </div>
  );
}
