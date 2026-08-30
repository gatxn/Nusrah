import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function zodError(error: ZodError) {
  const first = error.issues[0];
  return jsonError(first?.message ?? "Data si sahihi", 400, {
    issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  });
}

export const UNAUTHENTICATED = () => jsonError("Tafadhali ingia kwanza", 401);
export const FORBIDDEN = (message = "Huna ruhusa ya kufanya hili") => jsonError(message, 403);
export const NOT_FOUND = (message = "Haipatikani") => jsonError(message, 404);
