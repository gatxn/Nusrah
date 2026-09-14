// Creates a dedicated admin account — deliberately a fresh User row with no
// Profile, not an existing member's account upgraded in place, so an admin
// session never intersects with the (app) layout's onboarding/tier guards.
//
// Usage:
//   npm run admin:create -- "Full Name" phone@or-nothing email@example.com password

import bcrypt from "bcryptjs";
import { prisma } from "../lib/db.ts";

// bcryptjs directly, not lib/auth.ts's hashPassword — that module also
// imports next/headers (for the cookie helpers), which only resolves
// inside Next's own runtime, not a bare Node script.
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  const [, , name, phone, email, password] = process.argv;
  if (!name || !phone || !password) {
    console.error('Usage: npm run admin:create -- "Full Name" phone email password');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.user.create({
    data: {
      name,
      phone,
      email: email || undefined,
      passwordHash,
      otpVerified: true,
      role: "ADMIN",
    },
    select: { id: true, name: true, phone: true, email: true, role: true },
  });

  console.log("Admin account created:", JSON.stringify(admin, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
