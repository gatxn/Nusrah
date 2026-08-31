import { requireOnboardingStep } from "@/lib/onboarding-server";
import StepProgress from "@/components/onboarding/StepProgress";
import LifeForm from "@/components/onboarding/LifeForm";

export default async function OnboardingLifePage() {
  const { profile } = await requireOnboardingStep("life");

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <StepProgress current={3} />
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy">Maelezo ya Maisha</h1>
      </div>
      <LifeForm
        initialOccupation={profile.occupation}
        initialEducationLevel={profile.educationLevel}
        initialHeight={profile.height}
        initialBodyType={profile.bodyType}
        initialSkinTone={profile.skinTone}
        initialIncomeRange={profile.incomeRange}
        initialIntentions={profile.intentions}
        initialPartnerAgeMin={profile.partnerAgeMin}
        initialPartnerAgeMax={profile.partnerAgeMax}
        initialBio={profile.bio}
      />
    </div>
  );
}
