import { redirect } from "next/navigation";
import OtpForm from "@/components/auth/OtpForm";
import Logo from "@/components/Logo";
import { getDictionary, getLocale } from "../../dictionaries";
import { withLocale } from "@/lib/i18n/href";

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; devCode?: string; package?: string }>;
}) {
  const [{ userId, devCode, package: targetPackage }, dict, locale] = await Promise.all([
    searchParams,
    getDictionary(),
    getLocale(),
  ]);
  if (!userId) redirect(withLocale(`/${locale}`, "/jisajili"));

  return (
    <div className="bg-mosque-pattern px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Logo tagline={dict.common.tagline} />
          <h1 className="mt-4 text-2xl font-bold text-navy">{dict.thibitisha.title}</h1>
          <p className="mt-1 text-sm text-neutral-600">{dict.thibitisha.subtitle}</p>
          {devCode && (
            <p className="mt-3 rounded-lg bg-blush-50 px-3 py-2 text-xs text-primary">
              {dict.thibitisha.devModeNote} <strong>{devCode}</strong>
            </p>
          )}
        </div>

        <OtpForm userId={userId} initialDevCode={devCode} targetPackage={targetPackage} dict={dict.thibitisha} />
      </div>
    </div>
  );
}
