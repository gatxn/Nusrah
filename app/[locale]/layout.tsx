import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import { LOCALES, hasLocale, dirFor } from "./dictionaries";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nusrah — Pata Mwenzi Wako wa Maisha",
  description:
    "Nusrah ni jukwaa la ndoa la Kiislamu linalokusaidia kupata mwenzi wa maisha kwa njia salama, ya heshima na yenye misingi ya dini.",
};

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
