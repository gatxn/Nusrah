import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import { LOCALES, hasLocale, dirFor, getDictionary } from "./dictionaries";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

// Locale-aware — this is the only metadata definition in the app/[locale]
// tree (no per-page generateMetadata), so every locale relied on this single
// static export always shipping the Swahili title/description regardless of
// which locale was actually being viewed until this became a function.
export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.common.seo.title,
    description: dict.common.seo.metaDescription,
  };
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Single shared root layout (html/body/fonts only). Nav+Footer live in
// app/[locale]/(main)/layout.tsx; focused single-task views (e.g. login) live
// in app/[locale]/(focused)/layout.tsx with a minimal header instead —
// keeping ONE root layout here means switching between those groups is a
// normal client-side navigation, not a full page reload (see Next.js
// route-groups caveat).
export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${jakarta.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
