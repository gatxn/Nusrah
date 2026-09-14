"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function AdminReportFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("status", value);
    else params.delete("status");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={searchParams.get("status") ?? ""}
      onChange={(e) => setStatus(e.target.value)}
      className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-neutral-600"
    >
      <option value="">All Statuses</option>
      <option value="PENDING">Pending</option>
      <option value="RESOLVED">Resolved</option>
      <option value="DISMISSED">Dismissed</option>
    </select>
  );
}
