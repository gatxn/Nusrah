import { requireOnboardingStep } from "@/lib/onboarding-server";
import StepProgress from "@/components/onboarding/StepProgress";
import ReligionForm from "@/components/onboarding/ReligionForm";

export default async function OnboardingReligionPage() {
  const { profile } = await requireOnboardingStep("religion");

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <StepProgress current={2} />
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy">Maelezo ya Dini</h1>
      </div>
      <ReligionForm
        isFemale={profile.gender === "FEMALE"}
        initialReligion={profile.religion}
        initialMadhhab={profile.madhhab}
        initialPrayerHabit={profile.prayerHabit}
        initialWearsHijab={profile.wearsHijab}
        initialQuranLevel={profile.quranLevel}
        initialSubstanceUse={profile.substanceUse}
      />
    </div>
  );
}
