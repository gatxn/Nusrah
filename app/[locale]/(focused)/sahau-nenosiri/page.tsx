import LocaleLink from "@/components/LocaleLink";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { getDictionary } from "../../dictionaries";

export default async function ForgotPasswordPage() {
  const dict = await getDictionary();

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-auth-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-navy">{dict.sahauNenosiri.title}</h1>
        <p className="mt-1 text-sm text-neutral-600">{dict.sahauNenosiri.subtitle}</p>
      </div>

      <ForgotPasswordForm dict={dict.sahauNenosiri} />

      <div className="mt-6 text-center text-sm text-neutral-600">
        <LocaleLink href="/ingia" className="font-medium text-neutral-500 hover:text-primary">
          {dict.sahauNenosiri.backToLogin}
        </LocaleLink>
      </div>
    </div>
  );
}
