import { prisma } from "@/lib/db";
import { requireOnboardingStep } from "@/lib/onboarding-server";
import { getDictionary } from "@/app/[locale]/dictionaries";
import StepProgress from "@/components/onboarding/StepProgress";
import PersonalDetailsForm from "@/components/onboarding/PersonalDetailsForm";

export default async function OnboardingPersonalPage() {
  const { userId, profile } = await requireOnboardingStep("personal");
  const [user, dict] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    getDictionary(),
  ]);
  const t = dict.onboarding.personal;

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <StepProgress current={1} />
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy">{t.pageHeading}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t.pageSubtitle}</p>
      </div>
      <PersonalDetailsForm
        name={user.name}
        gender={profile.gender}
        initialDisplayName={profile.displayName}
        initialDob={profile.dob}
        initialCountry={profile.country}
        initialRegion={profile.region}
        initialCity={profile.city}
        initialMaritalStatus={profile.maritalStatus}
        dict={dict.onboarding}
        labels={dict.common.labels}
      />
    </div>
  );
}
