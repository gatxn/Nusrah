import { notFound } from "next/navigation";
import { getAdminUserDetail } from "@/lib/admin/users";
import VerificationActions from "@/components/admin/VerificationActions";

const STATUS_LABELS: Record<string, string> = {
  VERIFIED: "Verified",
  PENDING: "Pending",
  REJECTED: "Rejected",
  NOT_STARTED: "Not Started",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getAdminUserDetail(userId);
  if (!user) notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">{user.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">Joined {formatDate(user.createdAt)}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:col-span-1">
          {user.hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-only, authenticated fetch
            <img
              src={`/api/admin/profiles/${user.userId}/photo`}
              alt=""
              className="mx-auto h-32 w-32 rounded-full object-cover"
            />
          ) : (
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-blush-50 text-3xl font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Phone</dt>
              <dd className="font-medium text-navy">{user.phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Email</dt>
              <dd className="font-medium text-navy">{user.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Phone Verified</dt>
              <dd className="font-medium text-navy">{user.otpVerified ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Gender</dt>
              <dd className="font-medium text-navy">{user.gender ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Age</dt>
              <dd className="font-medium text-navy">{user.age ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Location</dt>
              <dd className="font-medium text-navy">{user.location ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Profile Verification</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Current status: <span className="font-semibold text-navy">{STATUS_LABELS[user.verificationStatus] ?? user.verificationStatus}</span>
            </p>
            <div className="mt-4">
              <VerificationActions userId={user.userId} currentStatus={user.verificationStatus} />
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Profile Details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-neutral-500">Bio</dt>
                <dd className="text-end font-medium text-navy">{user.bio ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Occupation</dt>
                <dd className="font-medium text-navy">{user.occupation ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Education</dt>
                <dd className="font-medium text-navy">{user.educationLevel ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Marital Status</dt>
                <dd className="font-medium text-navy">{user.maritalStatus ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Religion</dt>
                <dd className="font-medium text-navy">{user.religion ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
