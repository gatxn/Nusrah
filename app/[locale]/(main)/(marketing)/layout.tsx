import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Public/dual-audience surface: the homepage, marketing pages, package
// pricing, OTP verification, payment checkout, and Msaada/Usalama (both
// reachable and useful whether or not the visitor is logged in). No auth or
// onboarding gate here — see (app)/layout.tsx for the member-only shell.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
