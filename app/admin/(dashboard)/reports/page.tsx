import { queryAdminReports, isReportStatus } from "@/lib/admin/reports";
import AdminReportTable from "@/components/admin/AdminReportTable";
import AdminReportFilters from "@/components/admin/AdminReportFilters";
import AdminPagination from "@/components/admin/AdminPagination";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = isReportStatus(sp.status) ? sp.status : undefined;

  const result = await queryAdminReports({ page, status });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">Messages/Reports</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Reports filed against members are reviewed here. Reports are tied to a person, not a specific
        message — there is no message-level linkage in this system.
      </p>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 p-4">
          <AdminReportFilters />
        </div>
        <AdminReportTable reports={result.reports} />
        <AdminPagination
          page={result.page}
          pageSize={result.pageSize}
          totalCount={result.totalCount}
          basePath="/admin/reports"
          searchParams={sp}
        />
      </div>
    </div>
  );
}
