import { ShieldCheckIcon, PersonIcon, SearchIcon, ChatIcon, HeartOutlineIcon, MedalIcon } from "@/components/icons";

type Feature = { title: string; body: string };

const ICONS = [ShieldCheckIcon, PersonIcon, SearchIcon, ChatIcon, HeartOutlineIcon, MedalIcon];

export default function FeatureGrid({ items }: { items: Feature[] }) {
  return (
    <section className="grid grid-cols-2 gap-4 px-4 py-10 sm:px-6 md:grid-cols-3 lg:grid-cols-6 lg:px-12">
      {items.map((f, i) => {
        const Icon = ICONS[i];
        return (
          <div
            key={f.title}
            className="rounded-2xl border border-blush-200 bg-blush-50 p-6 text-center transition hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(88,40,90,0.1)]"
          >
            <div
              className="mx-auto mb-3.5 flex h-[46px] w-[46px] items-center justify-center rounded-full"
              style={{ background: "#fde3df", color: "#c9503f" }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <p className="font-heading mb-2 text-[14.5px] font-semibold text-navy">{f.title}</p>
            <p className="text-[12.5px] leading-relaxed text-muted">{f.body}</p>
          </div>
        );
      })}
    </section>
  );
}
