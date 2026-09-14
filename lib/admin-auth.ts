import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

/**
 * Always re-reads `role` fresh from the database — never trust a cached
 * value or a JWT claim, matching this codebase's own stated precedent for
 * tier checks (see getActiveSubscription's comment in lib/auth.ts). The
 * session cookie only proves "this browser is some authenticated user";
 * whether that user is currently an admin is a separate, live DB fact.
 */
export async function getSessionAdminUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function requireAdmin() {
  const admin = await getSessionAdminUser();
  if (!admin) {
    return { admin: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { admin, response: null };
}
