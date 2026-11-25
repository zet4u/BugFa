type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function cleanup() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function rateLimit(key: string, max: number, windowMs: number) {
  if (buckets.size > 5000) cleanup();
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return {
    success: bucket.count <= max,
    remaining: Math.max(0, max - bucket.count),
    retryAfterMs: Math.max(0, bucket.resetAt - now),
  };
}

export async function checkRateLimit(
  key: string,
  max = 10,
  windowMs = 60_000
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const result = rateLimit(key, max, windowMs);
  if (result.success) return { ok: true };
  return { ok: false, retryAfter: Math.ceil(result.retryAfterMs / 1000) };
}

export function clientIpFromHeaders(headers: Headers) {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
