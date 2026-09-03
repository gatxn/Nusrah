import LocaleLink from "@/components/LocaleLink";
import { getDictionary } from "@/app/[locale]/dictionaries";

export default async function WanachamaTabs({ active }: { active: "browse" | "liked-you" | "favorites" }) {
  const dict = await getDictionary();
  const t = dict.wanachama.tabs;
  const tabClass = (isActive: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive ? "bg-primary text-white" : "text-neutral-600 hover:bg-blush-50"
    }`;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <LocaleLink href="/wanachama" className={tabClass(active === "browse")}>
        {t.browse}
      </LocaleLink>
      <LocaleLink href="/wanachama/wamenipenda" className={tabClass(active === "liked-you")}>
        {t.likedYou}
      </LocaleLink>
      <LocaleLink href="/wanachama/vipendwa" className={tabClass(active === "favorites")}>
        {t.favorites}
      </LocaleLink>
    </div>
  );
}
