import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateAge } from "@/lib/profiles";

// Deliberately separate from lib/profiles.ts's queryMembers, which bakes in
// member-only browsing rules (opposite-gender filtering, tier view caps,
// block exclusion, favorite overlay) that don't apply to an admin looking
// at the whole user base.
export const ADMIN_USERS_PAGE_SIZE = 20;

export type AdminUserListParams = {
  page: number;
  gender?: "MALE" | "FEMALE";
  verificationStatus?: "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";
  sort?: "newest" | "oldest";
};

export type AdminUserRow = {
  userId: string;
  name: string;
  email: string | null;
  phone: string;
  gender: string | null;
  age: number | null;
  location: string | null;
  hasPhoto: boolean;
  verificationStatus: string;
  createdAt: Date;
};

export type AdminUserListResult = {
  users: AdminUserRow[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export async function queryAdminUsers(params: AdminUserListParams): Promise<AdminUserListResult> {
  const { page, gender, verificationStatus, sort = "newest" } = params;
  const skip = (page - 1) * ADMIN_USERS_PAGE_SIZE;

  const where: Prisma.UserWhereInput = {
    role: "MEMBER",
    profile: {
      ...(gender ? { gender } : {}),
      ...(verificationStatus ? { verificationStatus } : {}),
    },
  };

  const [rows, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        profile: {
          select: { gender: true, dob: true, city: true, region: true, photoUpdatedAt: true, verificationStatus: true },
        },
      },
      orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
      skip,
      take: ADMIN_USERS_PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: rows.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      gender: u.profile?.gender ?? null,
      age: calculateAge(u.profile?.dob ?? null),
      location: u.profile?.city ?? u.profile?.region ?? null,
      hasPhoto: !!u.profile?.photoUpdatedAt,
      verificationStatus: u.profile?.verificationStatus ?? "NOT_STARTED",
      createdAt: u.createdAt,
    })),
    page,
    pageSize: ADMIN_USERS_PAGE_SIZE,
    totalCount,
  };
}

export type AdminUserDetail = AdminUserRow & {
  bio: string | null;
  occupation: string | null;
  educationLevel: string | null;
  maritalStatus: string | null;
  religion: string | null;
  otpVerified: boolean;
};

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      otpVerified: true,
      profile: {
        select: {
          gender: true,
          dob: true,
          city: true,
          region: true,
          photoUpdatedAt: true,
          verificationStatus: true,
          bio: true,
          occupation: true,
          educationLevel: true,
          maritalStatus: true,
          religion: true,
        },
      },
    },
  });
  if (!u) return null;

  return {
    userId: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    gender: u.profile?.gender ?? null,
    age: calculateAge(u.profile?.dob ?? null),
    location: u.profile?.city ?? u.profile?.region ?? null,
    hasPhoto: !!u.profile?.photoUpdatedAt,
    verificationStatus: u.profile?.verificationStatus ?? "NOT_STARTED",
    createdAt: u.createdAt,
    bio: u.profile?.bio ?? null,
    occupation: u.profile?.occupation ?? null,
    educationLevel: u.profile?.educationLevel ?? null,
    maritalStatus: u.profile?.maritalStatus ?? null,
    religion: u.profile?.religion ?? null,
    otpVerified: u.otpVerified,
  };
}

const VALID_VERIFICATION_STATUSES = ["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED"] as const;
export type VerificationStatus = (typeof VALID_VERIFICATION_STATUSES)[number];

export function isVerificationStatus(value: unknown): value is VerificationStatus {
  return typeof value === "string" && (VALID_VERIFICATION_STATUSES as readonly string[]).includes(value);
}

export async function setVerificationStatus(userId: string, status: VerificationStatus): Promise<boolean> {
  const result = await prisma.profile.updateMany({ where: { userId }, data: { verificationStatus: status } });
  return result.count === 1;
}
