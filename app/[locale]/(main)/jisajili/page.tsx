import LocaleLink from "@/components/LocaleLink";
import RegisterForm from "@/components/auth/RegisterForm";
import Logo from "@/components/Logo";
import { getDictionary } from "../../dictionaries";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const [{ package: initialPackage }, dict] = await Promise.all([searchParams, getDictionary()]);

  return (
    <div className="bg-mosque-pattern px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-md rounded-2xl border border-black/5 bg-auth-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Logo tagline={dict.common.tagline} />
          <h1 className="mt-4 text-2xl font-bold text-navy">{dict.jisajili.title}</h1>
          <p className="mt-1 text-sm text-neutral-600">{dict.jisajili.subtitle}</p>
        </div>

        <RegisterForm initialPackage={initialPackage} dict={dict.jisajili} />

        <p className="mt-6 text-center text-sm text-neutral-600">
          {dict.jisajili.alreadyHaveAccount}{" "}
          <LocaleLink href="/ingia" className="font-semibold text-primary">
            {dict.jisajili.login}
          </LocaleLink>
        </p>
      </div>
    </div>
  );
}
