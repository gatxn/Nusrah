// Creates a dedicated admin account — deliberately a fresh User row with no
// Profile, not an existing member's account upgraded in place, so an admin
// session never intersects with the (app) layout's onboarding/tier guards.
//
// Admin accounts log in with a username, not a phone/email, so they never
// need to collide with — or reuse — a real member's contact info. `phone`
// is still populated internally (a random placeholder, never a real
// number) purely because the column is NOT NULL + unique; it is never
// read, shown, or used for an admin account.
//
// Usage:
//   npm run admin:create -- "Full Name" username password

import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/db.ts";

// bcryptjs directly, not lib/auth.ts's hashPassword — that module also
// imports next/headers (for the cookie helpers), which only resolves
// inside Next's own runtime, not a bare Node script.
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// This is the account with unrestricted admin access to the whole system —
// worth a real minimum bar, not just "non-empty", unlike a member's
// self-chosen password.
const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a digit")
  .regex(/[^a-zA-Z0-9]/, "Password must include a symbol");

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .regex(/^\S+$/, "Username cannot contain spaces");

async function main() {
  const [, , name, username, password] = process.argv;
  if (!name || !username || !password) {
    console.error('Usage: npm run admin:create -- "Full Name" username password');
    process.exit(1);
  }

  const parsedUsername = usernameSchema.safeParse(username);
  if (!parsedUsername.success) {
    console.error(parsedUsername.error.issues[0].message);
    process.exit(1);
  }

  const parsedPassword = passwordSchema.safeParse(password);
  if (!parsedPassword.success) {
    console.error(parsedPassword.error.issues[0].message);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.user.create({
    data: {
      name,
      phone: `admin-${randomUUID()}`,
      username,
      passwordHash,
      otpVerified: true,
      role: "ADMIN",
    },
    select: { id: true, name: true, username: true, role: true },
  });

  console.log("Admin account created:", JSON.stringify(admin, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
