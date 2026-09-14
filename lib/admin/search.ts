import { prisma } from "@/lib/db";

// Extends lib/profiles.ts's existing contains/insensitive OR-pattern
// (queryMembers's `search` filter) across User/Profile, plus Reports.
// Capped at a handful per group — this is a jump-to lookup, not a full
// search results page.
const RESULT_LIMIT = 5;
const MIN_QUERY_LENGTH = 2;

export type AdminSearchUserResult = { userId: string; name: string; phone: string; email: string | null };
export type AdminSearchReportResult = { id: string; reason: string; reportedUserName: string };

export type AdminSearchResult = {
  users: AdminSearchUserResult[];
  reports: AdminSearchReportResult[];
};

export async function searchAdmin(query: string): Promise<AdminSearchResult> {
  const q = query.trim();
  if (q.length < MIN_QUERY_LENGTH) return { users: [], reports: [] };

  const [users, reports] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "MEMBER",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { profile: { city: { contains: q, mode: "insensitive" } } },
          { profile: { occupation: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: { id: true, name: true, phone: true, email: true },
      take: RESULT_LIMIT,
    }),
    prisma.report.findMany({
      where: {
        OR: [
          { reason: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { reportedUser: { name: { contains: q, mode: "insensitive" } } },
          { reporter: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: { id: true, reason: true, reportedUser: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
    }),
  ]);

  return {
    users: users.map((u) => ({ userId: u.id, name: u.name, phone: u.phone, email: u.email })),
    reports: reports.map((r) => ({ id: r.id, reason: r.reason, reportedUserName: r.reportedUser.name })),
  };
}
