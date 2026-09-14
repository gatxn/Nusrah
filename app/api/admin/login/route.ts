import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// Separate from app/api/auth/login/route.ts on purpose: the admin panel is
// English-only (no dictionary/i18n dependency), skips OTP/onboarding
// entirely, and rejects a correct password for a non-admin account with the
// exact same generic message as a wrong password — never confirms whether
// a username belongs to an admin account at all.
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// A fixed, precomputed bcrypt hash with no corresponding real password.
// When the username lookup misses, we still run a bcrypt.compare against
// this so an "unknown username" response takes about as long as a "wrong
// password for a real username" response — otherwise the early return on a
// missed lookup is a timing side-channel an attacker can use to enumerate
// valid admin usernames before ever guessing a password.
const DUMMY_HASH = "$2b$12$my.KK8vSujFpKfsZSRrqd.GOJbldNRBd8UsRKNYZqVDtNeiWJEbzy";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

  const { username, password } = parsed.data;
  const limited = rateLimit(clientKey(request, `admin-login:${username}`), 8, 15 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  const genericError = () => NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const validPassword = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !validPassword) return genericError();
  if (user.role !== "ADMIN") return genericError();

  await setSessionCookie(user.id);
  return NextResponse.json({ name: user.name });
}
