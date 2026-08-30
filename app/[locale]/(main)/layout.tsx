import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getSessionUserId } from "@/lib/auth";
import { getNextIncompleteStep, STEP_ROUTES } from "@/lib/onboarding";
import { getOwnProfile } from "@/lib/onboarding-server";

// Server-authoritative gate: any authenticated user whose profile hasn't
// cleared onboarding Steps 1-3 is redirected there before any route in this
// group renders — mirrors the "never trust a client-reported done flag"
// principle already used for payment activation (see lib/tiers.ts). A no-op
// for anonymous visitors, who reach marketing pages normally.
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  if (userId) {
    const next = getNextIncompleteStep(await getOwnProfile(userId));
    if (next) redirect(STEP_ROUTES[next]);
  }

  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
