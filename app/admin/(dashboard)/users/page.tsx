import { queryAdminUsers, isVerificationStatus } from "@/lib/admin/users";
import AdminUserTable from "@/components/admin/AdminUserTable";
import AdminUserFilters from "@/components/admin/AdminUserFilters";
import AdminPagination from "@/components/admin/AdminPagination";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; gender?: string; verificationStatus?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const gender = sp.gender === "MALE" || sp.gender === "FEMALE" ? sp.gender : undefined;
  const verificationStatus = isVerificationStatus(sp.verificationStatus) ? sp.verificationStatus : undefined;
  const sort = sp.sort === "oldest" ? "oldest" : "newest";

  const result = await queryAdminUsers({ page, gender, verificationStatus, sort });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">Users</h1>
      <p className="mt-1 text-sm text-neutral-500">All registered members.</p>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 p-4">
          <AdminUserFilters />
        </div>
        <AdminUserTable users={result.users} />
        <AdminPagination
          page={result.page}
          pageSize={result.pageSize}
          totalCount={result.totalCount}
          basePath="/admin/users"
          searchParams={sp}
        />
      </div>
    </div>
  );
}
