import { requireOnboardingStep } from "@/lib/onboarding-server";
import StepProgress from "@/components/onboarding/StepProgress";
import AddressForm from "@/components/onboarding/AddressForm";

export default async function OnboardingAddressPage() {
  const { profile } = await requireOnboardingStep("address");

  return (
    <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <StepProgress current={2} />
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy">Anwani</h1>
        <p className="mt-1 text-sm text-neutral-600">Tuambie unapoishi</p>
      </div>
      <AddressForm initialCountry={profile.country} initialRegion={profile.region} initialCity={profile.city} />
    </div>
  );
}
