import { redirect } from "next/navigation";
import ResetOtpForm from "@/components/auth/ResetOtpForm";
import { getDictionary, getLocale } from "../../dictionaries";
import { withLocale } from "@/lib/i18n/href";

export default async function VerifyResetOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; devCode?: string }>;
}) {
  const [{ userId, devCode }, dict, locale] = await Promise.all([
    searchParams,
    getDictionary(),
    getLocale(),
  ]);
  if (!userId) redirect(withLocale(`/${locale}`, "/sahau-nenosiri"));

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-auth-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-navy">{dict.thibitishaNenosiri.title}</h1>
        <p className="mt-1 text-sm text-neutral-600">{dict.thibitishaNenosiri.subtitle}</p>
        {devCode && (
          <p className="mt-3 rounded-lg bg-blush-50 px-3 py-2 text-xs text-primary">
            {dict.thibitishaNenosiri.devModeNote} <strong>{devCode}</strong>
          </p>
        )}
      </div>

      <ResetOtpForm userId={userId} initialDevCode={devCode} dict={dict.thibitishaNenosiri} />
    </div>
  );
}
