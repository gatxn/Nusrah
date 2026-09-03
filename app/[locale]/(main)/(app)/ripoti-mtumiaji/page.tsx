import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { getDictionary } from "@/app/[locale]/dictionaries";
import ReportUserSearch from "@/components/wanachama/ReportUserSearch";
import { FlagIcon } from "@/components/icons";

export default async function ReportUserPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/ingia");

  const dict = await getDictionary();
  const t = dict.ripotiMtumiaji;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-2">
        <FlagIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-navy">{t.pageHeading}</h1>
      </div>
      <p className="mt-1 text-sm text-neutral-600">{t.subtitle}</p>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
        <ReportUserSearch dict={t.search} modalDict={t.modal} reasons={dict.common.reportReasons} />
      </div>
    </div>
  );
}
