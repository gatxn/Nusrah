import CountUpNumber from "@/components/CountUpNumber";
import { PersonIcon, HeartOutlineIcon, ShieldCheckIcon, MedalIcon, HeadsetIcon } from "@/components/icons";

const ICONS = [PersonIcon, HeartOutlineIcon, ShieldCheckIcon, MedalIcon, HeadsetIcon];

export default function StatsBar({
  items,
  headlines,
  disclaimer,
}: {
  items: string[];
  headlines: string[];
  disclaimer?: string;
}) {
  // The first three show a live animated count; the last two are localized
  // badge headlines (dict.home.statsHeadlines) — the translated sub-label is
  // rendered below each either way.
  const HEADLINES: React.ReactNode[] = [
    <CountUpNumber key="members" end={35000} suffix="+" />,
    <CountUpNumber key="marriages" end={2000} suffix="+" />,
    <CountUpNumber key="safety" end={100} suffix="%" />,
    headlines[0],
    headlines[1],
  ];
  return (
    <div
      className="border-y-[3px] border-gold px-6 py-6 sm:px-12 lg:px-20"
      style={{ background: "linear-gradient(120deg,#0d3b2b,#155c40)" }}
    >
      <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-5 sm:gap-y-0">
        {items.map((label, i) => {
          const Icon = ICONS[i];
          return (
            <div
              key={label}
              className={`flex items-center gap-3.5 ${i > 0 ? "sm:border-s sm:border-white/10 sm:ps-7" : ""}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="font-heading text-lg font-semibold text-white sm:text-xl">{HEADLINES[i]}</p>
                <p className="text-[12.5px] text-white/60">{label}</p>
              </div>
            </div>
          );
        })}
      </div>
      {disclaimer && <p className="mt-4 text-center text-[11px] text-white/40">{disclaimer}</p>}
    </div>
  );
}
