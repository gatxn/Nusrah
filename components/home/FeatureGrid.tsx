import { HeartHandIcon, LockIcon, ShieldCheckIcon, SearchIcon, ChatIcon } from "@/components/icons";

type Feature = { title: string; body: string };

const ICONS = [HeartHandIcon, LockIcon, ShieldCheckIcon, SearchIcon, ChatIcon];

export default function FeatureGrid({
  items,
  heading,
  subtitle,
}: {
  items: Feature[];
  heading?: string;
  subtitle?: string;
}) {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-12">
      {heading && (
        <div className="mx-auto mb-8 max-w-xl text-center">
          <h2 className="font-heading text-2xl font-bold text-navy sm:text-3xl">{heading}</h2>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
      </div>
    </section>
  );
}
