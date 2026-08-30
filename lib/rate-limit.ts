// Simple in-memory sliding-window rate limiter for auth endpoints.
// Good enough for a single-process dev/demo deployment; swap for a
// Redis-backed limiter before running multiple instances in production.

const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    const retryAfterMs = windowMs - (now - hits[0]);
    buckets.set(key, hits);
    return { allowed: false, retryAfterMs };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true };
}

export function clientKey(request: Request, extra: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return `${ip}:${extra}`;
}
