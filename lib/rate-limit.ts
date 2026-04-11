// Simple in-memory rate limiter.
// Works for single-instance deployments (suitable for this app).
// For multi-instance, replace with Redis-based solution (e.g. Upstash).

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

/**
 * Returns true if the request is allowed, false if rate limit exceeded.
 * @param key     - unique key (e.g. "geocode:1.2.3.4")
 * @param limit   - max requests per window
 * @param windowMs - time window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

/** Extract client IP from request headers. */
export function getClientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}
