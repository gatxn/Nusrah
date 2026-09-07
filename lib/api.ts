import { NextResponse, type NextRequest } from "next/server";
import type { ZodError } from "zod";
import { apiErrors } from "@/lib/i18n/api";

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function zodError(error: ZodError) {
  const first = error.issues[0];
  return jsonError(first?.message ?? "Data si sahihi", 400, {
    issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  });
}

export async function UNAUTHENTICATED(request: NextRequest) {
  const t = await apiErrors(request);
  return jsonError(t.unauthenticated, 401);
}

export async function FORBIDDEN(request: NextRequest, message?: string, extra?: Record<string, unknown>) {
  const t = await apiErrors(request);
  return jsonError(message ?? t.forbidden, 403, extra);
}

export async function NOT_FOUND(request: NextRequest) {
  const t = await apiErrors(request);
  return jsonError(t.notFound, 404);
}
