import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getOwnProfile } from "@/lib/onboarding-server";
import { hasPhoto } from "@/lib/onboarding";
import { getDictionary } from "@/app/[locale]/dictionaries";
import PersonalDetailsForm from "@/components/onboarding/PersonalDetailsForm";
import ReligionForm from "@/components/onboarding/ReligionForm";
import LifeForm from "@/components/onboarding/LifeForm";
import GuardianForm from "@/components/onboarding/GuardianForm";
import PhotoManager from "@/components/onboarding/PhotoManager";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="mb-5 text-lg font-semibold text-navy">{title}</h2>
      {children}
    </div>
  );
}

export default async function MyProfilePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/ingia");

  const [user, profile, dict] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    getOwnProfile(userId),
    getDictionary(),
  ]);
  if (!profile) redirect("/onboarding/personal");

  const photos = await prisma.profilePhoto.findMany({
    where: { profileId: profile.id },
    orderBy: { position: "asc" },
    select: { id: true, position: true },
  });

  const isFemale = profile.gender === "FEMALE";
  const t = dict.wasifuWangu;
  const labels = dict.common.labels;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t.heading}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t.subtitle}</p>
      </div>

      <SectionCard title={dict.onboarding.personal.pageHeading}>
        <PersonalDetailsForm
          name={user.name}
          gender={profile.gender}
          initialDisplayName={profile.displayName}
          initialDob={profile.dob}
          initialCountry={profile.country}
          initialRegion={profile.region}
          initialCity={profile.city}
          initialMaritalStatus={profile.maritalStatus}
          initialTribe={profile.tribe}
          standalone
          dict={dict.onboarding}
          labels={labels}
        />
      </SectionCard>

      <SectionCard title={dict.onboarding.religion.pageHeading}>
        <ReligionForm
          isFemale={isFemale}
          initialReligion={profile.religion}
          initialMadhhab={profile.madhhab}
          initialPrayerHabit={profile.prayerHabit}
          initialWearsHijab={profile.wearsHijab}
          initialQuranLevel={profile.quranLevel}
          initialSubstanceUse={profile.substanceUse}
          standalone
          dict={dict.onboarding}
          labels={labels}
        />
      </SectionCard>

      <SectionCard title={dict.onboarding.life.pageHeading}>
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
          standalone
          dict={dict.onboarding}
          labels={labels}
        />
      </SectionCard>

      <SectionCard title={dict.onboarding.guardian.pageHeading}>
        <GuardianForm
          initialHasGuardian={profile.hasGuardian}
          initialGuardianName={profile.guardianName}
          initialGuardianRelationship={profile.guardianRelationship}
          initialGuardianPhone={profile.guardianPhone}
          standalone
          dict={dict.onboarding}
          labels={labels}
        />
      </SectionCard>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
        <PhotoManager
          hasExistingPhoto={hasPhoto(profile)}
          initialGalleryPhotos={photos}
          standalone
          dict={dict.onboarding}
        />
      </div>
    </div>
  );
}
