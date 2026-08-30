import { requireOnboardingStep } from "@/lib/onboarding-server";
import StepProgress from "@/components/onboarding/StepProgress";
import IntentionsForm from "@/components/onboarding/IntentionsForm";

export default async function OnboardingIntentionsPage() {
  const { profile } = await requireOnboardingStep("intentions");

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <StepProgress current={3} />
      <IntentionsForm initialIntentions={profile.intentions} />
    </div>
  );
}
