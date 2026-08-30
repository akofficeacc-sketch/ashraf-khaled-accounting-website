/**
 * In-memory sliding-window rate limiter with memory bounding and defensive eviction.
 * Strictly adheres to RULE 2 (VALIDATE ALL INPUTS), RULE 5 (RESOURCE RELEASE),
 * and RULE 6 (BOUNDED OPERATIONS).
 */

import { logger } from "./logger";

export type RateLimitOptions = {
  /** Unique identifier for the caller (e.g. client IP or hashed key). */
  key: string;
  /** Maximum number of requests allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  success: boolean;
  /** Requests still allowed inside the current window. */
  remaining: number;
  /** Seconds until the window resets (0 on success). */
  retryAfterSec: number;
};

type Bucket = {
  windowMs: number;
  /** Hit timestamps, oldest first. */
  timestamps: number[];
  lastHit: number;
};

const buckets = new Map<string, Bucket>();

/** Stale buckets are swept periodically to bound memory usage. */
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanupAt = Date.now();

/**
 * Hard cap on simultaneously tracked keys so spoofed client identifiers can
 * never grow the Map without bound. When the cap is reached the oldest
 * bucket (Map preserves insertion order) is evicted first.
 */
const MAX_BUCKETS = 10_000;

/** Max length accepted for a client key (longest IPv6 text form is 45 chars). */
const MAX_KEY_LENGTH = 64;

/** Max timestamps allowed per bucket to prevent memory spike in case of extreme limit */
const MAX_TIMESTAMPS_PER_BUCKET = 500;

/** Drop timestamps that fell out of the bucket's sliding window. */
function pruneBucket(bucket: Bucket, now: number): void {
  const cutoff = now - bucket.windowMs;
  const timestamps = bucket.timestamps;
  let firstLive = 0;
  while (firstLive < timestamps.length && (timestamps[firstLive] ?? 0) <= cutoff) {
    firstLive += 1;
  }
  if (firstLive > 0) {
    bucket.timestamps = timestamps.slice(firstLive);
  }
}

function cleanupStaleBuckets(now: number): void {
  try {
    for (const [key, bucket] of buckets.entries()) {
      pruneBucket(bucket, now);
      if (bucket.timestamps.length === 0) {
        buckets.delete(key);
      }
    }
  } catch (err) {
    logger.error({
      module: "rate-limit",
      action: "cleanup",
      message: "Error during stale buckets cleanup",
      error: err,
    });
  }
}

export function rateLimit(options: RateLimitOptions): RateLimitResult {
  // RULE 2: Validate inputs
  if (!options || typeof options !== "object") {
    return { success: false, remaining: 0, retryAfterSec: 60 };
  }

  const rawKey = typeof options.key === "string" ? options.key : "unknown";
  const limit = typeof options.limit === "number" && Number.isFinite(options.limit) && options.limit > 0
    ? Math.min(options.limit, 1000)
    : 10;
  const windowMs = typeof options.windowMs === "number" && Number.isFinite(options.windowMs) && options.windowMs > 0
    ? Math.min(options.windowMs, 3600_000)
    : 60_000;

  const key = sanitizeKey(rawKey);
  const now = Date.now();

  if (now - lastCleanupAt >= CLEANUP_INTERVAL_MS) {
    lastCleanupAt = now;
    cleanupStaleBuckets(now);
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.windowMs !== windowMs) {
    if (buckets.size >= MAX_BUCKETS) {
      // Evict oldest bucket (FIFO)
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) {
        buckets.delete(oldestKey);
      }
    }
    bucket = { windowMs, timestamps: [], lastHit: now };
    buckets.set(key, bucket);
  }

  bucket.lastHit = now;
  pruneBucket(bucket, now);

  if (bucket.timestamps.length >= limit) {
    const oldestTimestamp = bucket.timestamps[0] ?? now;
    const resetAt = oldestTimestamp + bucket.windowMs;
    const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
    return {
      success: false,
      remaining: 0,
      retryAfterSec,
    };
  }

  // Bound timestamps array
  if (bucket.timestamps.length < MAX_TIMESTAMPS_PER_BUCKET) {
    bucket.timestamps.push(now);
  }

  return {
    success: true,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    retryAfterSec: 0,
  };
}

/**
 * Best-effort client identifier: first hop of `x-forwarded-for`, then
 * `x-real-ip`, falling back to "unknown".
 */
export function getClientKey(request: Request): string {
  try {
    if (!request || !request.headers) return "unknown";
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      const first = forwardedFor.split(",")[0]?.trim();
      if (first) return sanitizeKey(first);
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
      const trimmed = realIp.trim();
      if (trimmed) return sanitizeKey(trimmed);
    }
  } catch {
    return "unknown";
  }

  return "unknown";
}

/** Bound key length so arbitrary-length header junk cannot inflate memory. */
function sanitizeKey(key: string): string {
  if (typeof key !== "string") return "unknown";
  const cleaned = key.replace(/[^\w.:-]/g, "").slice(0, MAX_KEY_LENGTH);
  return cleaned.length > 0 ? cleaned : "unknown";
}
