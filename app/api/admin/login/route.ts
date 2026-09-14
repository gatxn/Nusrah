import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { normalizePhone, normalizeEmail, isPhoneNumber } from "@/lib/validation";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// Separate from app/api/auth/login/route.ts on purpose: the admin panel is
// English-only (no dictionary/i18n dependency), skips OTP/onboarding
// entirely, and rejects a correct password for a non-admin account with the
// exact same generic message as a wrong password — never confirms whether
// an identifier belongs to an admin account at all.
const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

  const { identifier, password } = parsed.data;
  const limited = rateLimit(clientKey(request, `admin-login:${identifier}`), 8, 15 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const user = isPhoneNumber(identifier)
    ? await prisma.user.findUnique({ where: { phone: normalizePhone(identifier) } })
    : await prisma.user.findUnique({ where: { email: normalizeEmail(identifier) } });

  const genericError = () => NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  if (!user) return genericError();

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) return genericError();
  if (user.role !== "ADMIN") return genericError();

  await setSessionCookie(user.id);
  return NextResponse.json({ name: user.name });
}
