import { hasPhoto, hasIdDocument } from "@/lib/onboarding";
import { requireOnboardingReady } from "@/lib/onboarding-server";
import StepProgress from "@/components/onboarding/StepProgress";
import PhotoStep from "@/components/onboarding/PhotoStep";

export default async function OnboardingPhotoPage() {
  const { profile } = await requireOnboardingReady();

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <StepProgress current={5} />
      <PhotoStep hasExistingPhoto={hasPhoto(profile)} hasExistingIdDocument={hasIdDocument(profile)} />
    </div>
  );
}
