import { redirect } from "next/navigation";
import NewPasswordForm from "@/components/auth/NewPasswordForm";
import { getDictionary, getLocale } from "../../dictionaries";
import { withLocale } from "@/lib/i18n/href";

export default async function NewPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; resetToken?: string }>;
}) {
  const [{ userId, resetToken }, dict, locale] = await Promise.all([
    searchParams,
    getDictionary(),
    getLocale(),
  ]);
  if (!userId || !resetToken) redirect(withLocale(`/${locale}`, "/sahau-nenosiri"));

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-auth-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-navy">{dict.nenosiriJipya.title}</h1>
        <p className="mt-1 text-sm text-neutral-600">{dict.nenosiriJipya.subtitle}</p>
      </div>

      <NewPasswordForm userId={userId} resetToken={resetToken} dict={dict.nenosiriJipya} />
    </div>
  );
}
