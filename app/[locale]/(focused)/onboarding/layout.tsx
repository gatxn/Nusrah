export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-onboarding-photo flex w-full self-stretch items-center justify-center px-4 py-10 sm:px-6">
      {children}
    </div>
  );
}
