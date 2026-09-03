import { requireOnboardingStep } from "@/lib/onboarding-server";
import { getDictionary } from "@/app/[locale]/dictionaries";
import StepProgress from "@/components/onboarding/StepProgress";
import LifeForm from "@/components/onboarding/LifeForm";

export default async function OnboardingLifePage() {
  const { profile } = await requireOnboardingStep("life");
  const dict = await getDictionary();
  const t = dict.onboarding.life;

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <StepProgress current={3} />
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy">{t.pageHeading}</h1>
      </div>
      <LifeForm
        initialOccupation={profile.occupation}
        initialEducationLevel={profile.educationLevel}
        initialHeight={profile.height}
        initialBodyType={profile.bodyType}
        initialSkinTone={profile.skinTone}
        initialIncomeRange={profile.incomeRange}
        initialHasDisability={profile.hasDisability}
        initialDisabilityType={profile.disabilityType}
        initialIntentions={profile.intentions}
        initialPartnerAgeMin={profile.partnerAgeMin}
        initialPartnerAgeMax={profile.partnerAgeMax}
        initialBio={profile.bio}
        dict={dict.onboarding}
        labels={dict.common.labels}
      />
    </div>
  );
}
