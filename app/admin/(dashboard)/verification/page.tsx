import { queryAdminUsers } from "@/lib/admin/users";
import AdminUserTable from "@/components/admin/AdminUserTable";
import AdminPagination from "@/components/admin/AdminPagination";

// Profiles awaiting review — always filtered to PENDING. Verified/Rejected
// history is browsable via the full Users list (?verificationStatus=...)
// instead of duplicating that filter UI here.
export default async function AdminVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await queryAdminUsers({ page, verificationStatus: "PENDING", sort: "oldest" });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">Profiles & Verification</h1>
      <p className="mt-1 text-sm text-neutral-500">{result.totalCount} profile(s) awaiting review, oldest first.</p>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white shadow-sm">
        <AdminUserTable users={result.users} />
        <AdminPagination
          page={result.page}
          pageSize={result.pageSize}
          totalCount={result.totalCount}
          basePath="/admin/verification"
          searchParams={sp}
        />
      </div>
    </div>
  );
}
