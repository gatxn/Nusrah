import { getDictionary } from "@/app/[locale]/dictionaries";

export default async function StepProgress({ current }: { current: 1 | 2 | 3 | 4 | 5 }) {
  const total = 5;
  const dict = await getDictionary();
  const t = dict.onboarding.stepProgress;

  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {t.step} {current} {t.of} {total}
      </p>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < current ? "bg-primary" : "bg-blush-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
