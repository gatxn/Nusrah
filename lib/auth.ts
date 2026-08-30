import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { effectiveTier, isSubscriptionLive, type Tier } from "@/lib/tiers";

export const SESSION_COOKIE = "nusrah_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (typeof payload.sub !== "string") return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

/** Call only from a Route Handler or Server Action. */
export async function setSessionCookie(userId: string): Promise<void> {
  const token = await signSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Call only from a Route Handler or Server Action. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  return session?.userId ?? null;
}

export async function getSessionUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export type ActiveSubscription = {
  tier: Tier | "FREE";
  status: string;
  expiryDate: Date;
  packageName: string;
};

/**
 * Re-reads the subscription straight from the database — this is the ONLY
 * source of truth for a user's tier. Never derive tier from a JWT claim or
 * anything the client sends. Returns null if the user has no live paid
 * subscription (i.e. they should be treated as FREE).
 */
export async function getActiveSubscription(
  userId: string
): Promise<ActiveSubscription | null> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { package: true },
  });
  if (!sub) return null;
  if (!isSubscriptionLive(sub)) return null;
  return {
    tier: effectiveTier({
      status: sub.status,
      expiryDate: sub.expiryDate,
      tier: sub.package.tier,
    }),
    status: sub.status,
    expiryDate: sub.expiryDate,
    packageName: sub.package.name,
  };
}

export async function getEffectiveTier(userId: string): Promise<Tier> {
  const sub = await getActiveSubscription(userId);
  return (sub?.tier as Tier) ?? "FREE";
}
