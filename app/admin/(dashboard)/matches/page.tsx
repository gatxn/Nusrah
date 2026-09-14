import Link from "next/link";
import { findMutualMatches } from "@/lib/admin/matches";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default async function AdminMatchesPage() {
  const matches = await findMutualMatches();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">Matches</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {matches.length} mutual match{matches.length === 1 ? "" : "es"} — pairs where both members favorited
        each other. Computed live; there is no separate Match record in the database.
      </p>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white shadow-sm">
        {matches.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">No mutual matches yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Matched</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={`${m.userAId}-${m.userBId}`} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${m.userAId}`} className="font-medium text-navy hover:text-primary">
                      {m.userAName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${m.userBId}`} className="font-medium text-navy hover:text-primary">
                      {m.userBName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(m.matchedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
