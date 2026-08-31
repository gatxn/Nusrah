export default function StepProgress({ current }: { current: 1 | 2 | 3 | 4 | 5 }) {
  const total = 5;
  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Hatua {current} kati ya {total}
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
