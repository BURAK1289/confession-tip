import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  checkRateLimit,
  checkConfessionRateLimit,
  checkTipRateLimit,
  getRemainingQuota,
  resetRateLimit,
  clearAllRateLimits,
  formatRateLimitError,
  RATE_LIMITS,
} from "./rate-limit";

/**
 * Property 30: Rate Limiting
 * Validates: Requirements 12.5
 *
 * For any user, the system should enforce rate limits on
 * confession creation (10/day) and tipping (50/day).
 */
describe("Property 30: Rate Limiting", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  const addressArbitrary = fc
    .array(
      fc.constantFrom(
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
        "a", "b", "c", "d", "e", "f"
      ),
      { minLength: 40, maxLength: 40 }
    )
    .map((chars) => "0x" + chars.join(""));

  /**
   * Feature: confession-tip, Property 30: Rate Limiting
   * Validates: Requirements 12.5
   *
   * For any user, the first N requests within the limit should succeed.
   */
  it("should allow requests within the limit", async () => {
    await fc.assert(
      fc.asyncProperty(
        addressArbitrary,
        fc.integer({ min: 1, max: 10 }),
        async (userAddress, requestCount) => {
          clearAllRateLimits();

          // Make requests up to the limit
          for (let i = 0; i < requestCount; i++) {
            const result = checkConfessionRateLimit(userAddress);
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(RATE_LIMITS.CONFESSIONS.maxRequests - (i + 1));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 30: Rate Limiting
   * Validates: Requirements 12.5
   *
   * For any user, requests exceeding the limit should be rejected.
   */
  it("should reject requests exceeding the limit", async () => {
    await fc.assert(
      fc.asyncProperty(
        addressArbitrary,
        fc.integer({ min: 1, max: 5 }),
        async (userAddress, extraRequests) => {
          clearAllRateLimits();

          // Exhaust the limit
          for (let i = 0; i < RATE_LIMITS.CONFESSIONS.maxRequests; i++) {
            checkConfessionRateLimit(userAddress);
          }

          // Additional requests should fail
          for (let i = 0; i < extraRequests; i++) {
            const result = checkConfessionRateLimit(userAddress);
            expect(result.success).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.retryAfter).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 30: Rate Limiting
   * Validates: Requirements 12.5
   *
   * Rate limits should be independent per user.
   */
  it("should have independent rate limits per user", async () => {
    await fc.assert(
      fc.asyncProperty(
        addressArbitrary,
        addressArbitrary.filter((a) => a !== "0x0000000000000000000000000000000000000000"),
        async (user1, user2) => {
          // Skip if same user
          if (user1 === user2) return;

          clearAllRateLimits();

          // Exhaust user1's limit
          for (let i = 0; i < RATE_LIMITS.CONFESSIONS.maxRequests; i++) {
            checkConfessionRateLimit(user1);
          }

          // User1 should be rate limited
          const user1Result = checkConfessionRateLimit(user1);
          expect(user1Result.success).toBe(false);

          // User2 should still have full quota
          const user2Result = checkConfessionRateLimit(user2);
          expect(user2Result.success).toBe(true);
          expect(user2Result.remaining).toBe(RATE_LIMITS.CONFESSIONS.maxRequests - 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 30: Rate Limiting
   * Validates: Requirements 12.5
   *
   * Confession and tip limits should be independent.
   */
  it("should have independent limits for confessions and tips", async () => {
    await fc.assert(
      fc.asyncProperty(addressArbitrary, async (userAddress) => {
        clearAllRateLimits();

        // Exhaust confession limit
        for (let i = 0; i < RATE_LIMITS.CONFESSIONS.maxRequests; i++) {
          checkConfessionRateLimit(userAddress);
        }

        // Confession should be rate limited
        const confessionResult = checkConfessionRateLimit(userAddress);
        expect(confessionResult.success).toBe(false);

        // Tips should still work
        const tipResult = checkTipRateLimit(userAddress);
        expect(tipResult.success).toBe(true);
        expect(tipResult.remaining).toBe(RATE_LIMITS.TIPS.maxRequests - 1);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 30: Rate Limiting
   * Validates: Requirements 12.5
   *
   * Remaining quota should be accurate.
   */
  it("should return accurate remaining quota", async () => {
    await fc.assert(
      fc.asyncProperty(
        addressArbitrary,
        fc.integer({ min: 0, max: 10 }),
        async (userAddress, requestCount) => {
          clearAllRateLimits();

          // Make some requests
          for (let i = 0; i < requestCount; i++) {
            checkConfessionRateLimit(userAddress);
          }

          // Check remaining quota
          const quota = getRemainingQuota(userAddress, "confession");
          expect(quota.remaining).toBe(
            Math.max(0, RATE_LIMITS.CONFESSIONS.maxRequests - requestCount)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 30: Rate Limiting
   * Validates: Requirements 12.5
   *
   * Reset should restore full quota.
   */
  it("should restore full quota after reset", async () => {
    await fc.assert(
      fc.asyncProperty(addressArbitrary, async (userAddress) => {
        clearAllRateLimits();

        // Exhaust limit
        for (let i = 0; i < RATE_LIMITS.CONFESSIONS.maxRequests; i++) {
          checkConfessionRateLimit(userAddress);
        }

        // Should be rate limited
        expect(checkConfessionRateLimit(userAddress).success).toBe(false);

        // Reset
        resetRateLimit(`confession:${userAddress}`);

        // Should have full quota again
        const result = checkConfessionRateLimit(userAddress);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(RATE_LIMITS.CONFESSIONS.maxRequests - 1);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 30: Rate Limiting
   * Validates: Requirements 12.5
   *
   * Custom rate limit config should work correctly.
   */
  it("should respect custom rate limit config", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }),
        fc.integer({ min: 1, max: 20 }),
        async (identifier, maxRequests) => {
          clearAllRateLimits();

          const config = {
            maxRequests,
            windowMs: 60000,
          };

          // Make requests up to limit
          for (let i = 0; i < maxRequests; i++) {
            const result = checkRateLimit(identifier, config);
            expect(result.success).toBe(true);
          }

          // Next request should fail
          const result = checkRateLimit(identifier, config);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 30: Rate Limiting
   * Validates: Requirements 12.5
   *
   * Error messages should be user-friendly.
   */
  it("should format user-friendly error messages", () => {
    const now = Date.now();

    // Test minutes format
    const shortResult = {
      success: false,
      remaining: 0,
      resetAt: now + 30 * 60 * 1000, // 30 minutes
      retryAfter: 1800,
    };
    const shortMessage = formatRateLimitError(shortResult, "confession");
    expect(shortMessage).toContain("minute");
    expect(shortMessage).toContain("confession");

    // Test hours format
    const longResult = {
      success: false,
      remaining: 0,
      resetAt: now + 3 * 60 * 60 * 1000, // 3 hours
      retryAfter: 10800,
    };
    const longMessage = formatRateLimitError(longResult, "tip");
    expect(longMessage).toContain("hour");
    expect(longMessage).toContain("tip");
  });
});
