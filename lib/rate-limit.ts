/**
 * Rate Limiting Utility
 * Requirements: 12.5
 *
 * In-memory rate limiting for development.
 * For production, use Redis (Upstash) for distributed rate limiting.
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configurations
export const RATE_LIMITS = {
  CONFESSIONS: {
    maxRequests: 10,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  TIPS: {
    maxRequests: 50,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  API_GENERAL: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
};

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  // Get or create entry
  let entry = rateLimitStore.get(key);

  // Reset if window has passed
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Check confession rate limit
 */
export function checkConfessionRateLimit(userAddress: string): RateLimitResult {
  return checkRateLimit(`confession:${userAddress}`, RATE_LIMITS.CONFESSIONS);
}

/**
 * Check tip rate limit
 */
export function checkTipRateLimit(userAddress: string): RateLimitResult {
  return checkRateLimit(`tip:${userAddress}`, RATE_LIMITS.TIPS);
}

/**
 * Get remaining quota for a user
 */
export function getRemainingQuota(
  userAddress: string,
  type: "confession" | "tip"
): { remaining: number; resetAt: number } {
  const config = type === "confession" ? RATE_LIMITS.CONFESSIONS : RATE_LIMITS.TIPS;
  const key = `${type}:${userAddress}`;
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || now >= entry.resetAt) {
    return {
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a user (for testing)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get rate limit headers for API response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toString(),
    ...(result.retryAfter && { "Retry-After": result.retryAfter.toString() }),
  };
}

/**
 * Format rate limit error message
 */
export function formatRateLimitError(result: RateLimitResult, type: string): string {
  const timeUntilReset = Math.ceil((result.resetAt - Date.now()) / 1000 / 60);

  if (timeUntilReset > 60) {
    const hours = Math.ceil(timeUntilReset / 60);
    return `You've reached the ${type} limit. Try again in ${hours} hour${hours > 1 ? "s" : ""}.`;
  }

  return `You've reached the ${type} limit. Try again in ${timeUntilReset} minute${timeUntilReset > 1 ? "s" : ""}.`;
}
