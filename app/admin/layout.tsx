import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Poppins } from "next/font/google";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-sans", subsets: ["latin"] });
const poppins = Poppins({ variable: "--font-heading", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "Nusrah Admin",
  description: "Nusrah internal admin dashboard.",
};

// Independent second root layout (Next.js's documented multi-root-layout
// pattern) — the admin panel is English-only and has nothing to do with the
// member app's locale routing, so it deliberately sits OUTSIDE app/[locale]
// rather than nesting under it (which would drag in the whole
// dictionary/getLocale machinery for no reason). proxy.ts excludes /admin
// from its locale-rewrite matcher to make this work.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full bg-neutral-50">{children}</body>
    </html>
  );
}
