import { prisma } from "@/lib/db";
import { hasPhoto } from "@/lib/onboarding";
import { requireOnboardingReady } from "@/lib/onboarding-server";
import { getDictionary } from "@/app/[locale]/dictionaries";
import StepProgress from "@/components/onboarding/StepProgress";
import PhotoManager from "@/components/onboarding/PhotoManager";

export default async function OnboardingPhotoPage() {
  const { profile } = await requireOnboardingReady();
  const [photos, dict] = await Promise.all([
    prisma.profilePhoto.findMany({
      where: { profileId: profile.id },
      orderBy: { position: "asc" },
      select: { id: true, position: true },
    }),
    getDictionary(),
  ]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <StepProgress current={5} />
      <PhotoManager hasExistingPhoto={hasPhoto(profile)} initialGalleryPhotos={photos} dict={dict.onboarding} />
    </div>
  );
}
