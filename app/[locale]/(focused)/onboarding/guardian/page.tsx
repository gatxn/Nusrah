import { requireOnboardingReady } from "@/lib/onboarding-server";
import { getDictionary } from "@/app/[locale]/dictionaries";
import StepProgress from "@/components/onboarding/StepProgress";
import GuardianForm from "@/components/onboarding/GuardianForm";

export default async function OnboardingGuardianPage() {
  const { profile } = await requireOnboardingReady();
  const dict = await getDictionary();

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <StepProgress current={4} />
      <GuardianForm
        initialHasGuardian={profile.hasGuardian}
        initialGuardianName={profile.guardianName}
        initialGuardianRelationship={profile.guardianRelationship}
        initialGuardianPhone={profile.guardianPhone}
        dict={dict.onboarding}
        labels={dict.common.labels}
      />
    </div>
  );
}
