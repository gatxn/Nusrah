export default function StatCard({
  icon,
  label,
  value,
  changePercent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  changePercent?: number | null;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-50 text-primary">{icon}</div>
      <p className="mt-3 text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-navy">{value}</p>
      {changePercent !== undefined && changePercent !== null && (
        <p className={`mt-1 text-xs font-semibold ${changePercent >= 0 ? "text-green-600" : "text-red-500"}`}>
          {changePercent >= 0 ? "↑" : "↓"} {Math.abs(changePercent)}%{" "}
          <span className="font-normal text-neutral-400">vs last 30 days</span>
        </p>
      )}
    </div>
  );
}
