import LocaleLink from "@/components/LocaleLink";
import LoginForm from "@/components/auth/LoginForm";
import { getDictionary } from "../../dictionaries";

export default async function LoginPage() {
  const dict = await getDictionary();

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-auth-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-navy">{dict.ingia.title}</h1>
        <p className="mt-1 text-sm text-neutral-600">{dict.ingia.subtitle}</p>
      </div>

      <LoginForm dict={dict.ingia} />

      <div className="mt-6 space-y-2 text-center text-sm text-neutral-600">
        <p>
          <LocaleLink href="/msaada" className="font-medium text-neutral-500 hover:text-primary">
            {dict.ingia.forgotPassword}
          </LocaleLink>
        </p>
        <p>
          {dict.ingia.noAccount}{" "}
          <LocaleLink href="/jisajili" className="font-semibold text-primary">
            {dict.ingia.joinNow}
          </LocaleLink>
        </p>
      </div>
    </div>
  );
}
