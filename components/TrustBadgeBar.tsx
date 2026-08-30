import { ShieldCheckIcon, HeartHandIcon, CheckIcon, ClockIcon } from "@/components/icons";

type Badge = { icon: React.ReactNode; label: string };

const DEFAULT_BADGES: Badge[] = [
  { icon: <ShieldCheckIcon />, label: "Salama & Faragha" },
  { icon: <HeartHandIcon />, label: "Kwa Ajili ya Ndoa Pekee" },
  { icon: <CheckIcon />, label: "Wanachama Waliothibitishwa" },
  { icon: <ClockIcon />, label: "Huduma kwa Ufanisi" },
];

export default function TrustBadgeBar({ badges = DEFAULT_BADGES }: { badges?: Badge[] }) {
  return (
    <section className="bg-navy py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6">
        {badges.map((badge) => (
          <div key={badge.label} className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-primary-light">
              {badge.icon}
            </span>
            <span className="text-xs font-medium text-white/80 sm:text-sm">{badge.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
