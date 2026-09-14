"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function AdminUserFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={searchParams.get("gender") ?? ""}
        onChange={(e) => setParam("gender", e.target.value)}
        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-neutral-600"
      >
        <option value="">All Genders</option>
        <option value="MALE">Male</option>
        <option value="FEMALE">Female</option>
      </select>

      <select
        value={searchParams.get("verificationStatus") ?? ""}
        onChange={(e) => setParam("verificationStatus", e.target.value)}
        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-neutral-600"
      >
        <option value="">All Verification Status</option>
        <option value="VERIFIED">Verified</option>
        <option value="PENDING">Pending</option>
        <option value="REJECTED">Rejected</option>
        <option value="NOT_STARTED">Not Started</option>
      </select>

      <select
        value={searchParams.get("sort") ?? "newest"}
        onChange={(e) => setParam("sort", e.target.value)}
        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-neutral-600"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>
    </div>
  );
}
