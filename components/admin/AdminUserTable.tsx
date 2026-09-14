import Link from "next/link";
import type { AdminUserRow } from "@/lib/admin/users";

const STATUS_STYLES: Record<string, string> = {
  VERIFIED: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-600",
  NOT_STARTED: "bg-neutral-100 text-neutral-500",
};

const STATUS_LABELS: Record<string, string> = {
  VERIFIED: "Verified",
  PENDING: "Pending",
  REJECTED: "Rejected",
  NOT_STARTED: "Not Started",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default function AdminUserTable({ users }: { users: AdminUserRow[] }) {
  if (users.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-neutral-500">No users match these filters.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            <th className="px-4 py-3">Profile</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Gender</th>
            <th className="px-4 py-3">Age</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Verification Status</th>
            <th className="px-4 py-3">Joined Date</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.userId} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-3">
                {u.hasPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-only, authenticated, non-optimized fetch is fine here
                  <img
                    src={`/api/admin/profiles/${u.userId}/photo`}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-50 text-xs font-bold text-primary">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 font-medium text-navy">{u.name}</td>
              <td className="px-4 py-3 text-neutral-600">{u.gender ?? "—"}</td>
              <td className="px-4 py-3 text-neutral-600">{u.age ?? "—"}</td>
              <td className="px-4 py-3 text-neutral-600">{u.location ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[u.verificationStatus] ?? STATUS_STYLES.NOT_STARTED}`}
                >
                  {STATUS_LABELS[u.verificationStatus] ?? u.verificationStatus}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-600">{formatDate(u.createdAt)}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/users/${u.userId}`}
                  className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy/90"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
