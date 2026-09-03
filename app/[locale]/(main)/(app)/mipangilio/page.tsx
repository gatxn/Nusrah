import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getDictionary, getLocale } from "@/app/[locale]/dictionaries";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";
import BlockedUsersList from "@/components/account/BlockedUsersList";
import DeleteAccountModal from "@/components/account/DeleteAccountModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="mb-5 text-lg font-semibold text-navy">{title}</h2>
      {children}
    </div>
  );
}

export default async function SettingsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/ingia");

  const [blockRows, dict, locale] = await Promise.all([
    prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedUserId: true, blockedUser: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getDictionary(),
    getLocale(),
  ]);
  const blocked = blockRows.map((r) => ({ blockedUserId: r.blockedUserId, name: r.blockedUser.name }));
  const t = dict.mipangilio;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t.pageHeading}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t.subtitle}</p>
      </div>

      <SectionCard title={dict.common.languageSwitcher.label}>
        <p className="mb-4 text-sm text-neutral-600">{t.languageDescription}</p>
        <LanguageSwitcher currentLocale={locale} label={dict.common.languageSwitcher.label} />
      </SectionCard>

      <SectionCard title={t.changePasswordTitle}>
        <ChangePasswordForm dict={t.changePasswordForm} />
      </SectionCard>

      <SectionCard title={t.blockedUsersTitle}>
        <BlockedUsersList initialBlocked={blocked} dict={t.blockedUsersList} />
      </SectionCard>

      <SectionCard title={t.deleteAccountTitle}>
        <p className="mb-4 text-sm text-neutral-600">{t.deleteAccountWarning}</p>
        <DeleteAccountModal dict={t.deleteAccountModal} />
      </SectionCard>
    </div>
  );
}
