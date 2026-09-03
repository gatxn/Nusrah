import { requireOnboardingStep } from "@/lib/onboarding-server";
import { getDictionary } from "@/app/[locale]/dictionaries";
import StepProgress from "@/components/onboarding/StepProgress";
import ReligionForm from "@/components/onboarding/ReligionForm";

export default async function OnboardingReligionPage() {
  const { profile } = await requireOnboardingStep("religion");
  const dict = await getDictionary();
  const t = dict.onboarding.religion;

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <StepProgress current={2} />
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy">{t.pageHeading}</h1>
      </div>
      <ReligionForm
        isFemale={profile.gender === "FEMALE"}
        initialReligion={profile.religion}
        initialMadhhab={profile.madhhab}
        initialPrayerHabit={profile.prayerHabit}
        initialWearsHijab={profile.wearsHijab}
        initialQuranLevel={profile.quranLevel}
        initialSubstanceUse={profile.substanceUse}
        dict={dict.onboarding}
        labels={dict.common.labels}
      />
    </div>
  );
}
