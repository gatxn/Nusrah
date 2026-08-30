import { prisma } from "@/lib/db";
import { requireOnboardingStep } from "@/lib/onboarding-server";
import StepProgress from "@/components/onboarding/StepProgress";
import PersonalDetailsForm from "@/components/onboarding/PersonalDetailsForm";

export default async function OnboardingPersonalPage() {
  const { userId, profile } = await requireOnboardingStep("personal");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <StepProgress current={1} />
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy">Maelezo Binafsi</h1>
        <p className="mt-1 text-sm text-neutral-600">Thibitisha taarifa zako na ongeza tarehe ya kuzaliwa</p>
      </div>
      <PersonalDetailsForm name={user.name} gender={profile.gender} initialDob={profile.dob} />
    </div>
  );
}
