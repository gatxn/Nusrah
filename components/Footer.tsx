import LocaleLink from "@/components/LocaleLink";
import Logo from "@/components/Logo";
import { getDictionary } from "@/app/[locale]/dictionaries";

export default async function Footer() {
  const dict = await getDictionary();
  const nav = dict.common.nav;
  const footer = dict.common.footer;

  return (
    <footer className="bg-navy text-blush-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo tagline={dict.common.tagline} />
            <p className="mt-3 text-sm text-white/60">{footer.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{footer.pagesHeading}</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><LocaleLink href="/" className="hover:text-white">{nav.home}</LocaleLink></li>
              <li><LocaleLink href="/jinsi-inavyofanyakazi" className="hover:text-white">{nav.howItWorks}</LocaleLink></li>
              <li><LocaleLink href="/kuwa-mwanachama" className="hover:text-white">{nav.membership}</LocaleLink></li>
              <li><LocaleLink href="/mafanikio" className="hover:text-white">{nav.successStories}</LocaleLink></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{footer.helpHeading}</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><LocaleLink href="/msaada" className="hover:text-white">{footer.faq}</LocaleLink></li>
              <li><LocaleLink href="/msaada" className="hover:text-white">{footer.contactUs}</LocaleLink></li>
              <li><LocaleLink href="/ingia" className="hover:text-white">{nav.login}</LocaleLink></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{footer.contactHeading}</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>msaada@nusrah.co.tz</li>
              <li>+255 700 000 000</li>
              <li>{footer.hours}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Nusrah. {footer.copyright}
        </div>
      </div>
    </footer>
  );
}
