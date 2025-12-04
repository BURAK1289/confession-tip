import { supabaseServer } from "@/lib/supabase/server";
import { RateLimitError } from "@/types";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Check if a user has exceeded the rate limit for a specific action
 * @param userAddress - The user's wallet address
 * @param action - The action being rate limited (e.g., 'confession', 'tip')
 * @param config - Rate limit configuration
 * @returns true if within limit, throws RateLimitError if exceeded
 */
export async function checkRateLimit(
  userAddress: string,
  action: "confession" | "tip",
  config: RateLimitConfig
): Promise<boolean> {
  const windowStart = new Date(Date.now() - config.windowMs);

  if (action === "confession") {
    // Count confessions created in the time window
    const { count, error } = await supabaseServer
      .from("confessions")
      .select("*", { count: "exact", head: true })
      .eq("author_address", userAddress)
      .gte("created_at", windowStart.toISOString());

    if (error) {
      console.error("Rate limit check error:", error);
      // Fail open - allow the request if we can't check the limit
      return true;
    }

    if (count !== null && count >= config.maxRequests) {
      throw new RateLimitError(
        `Rate limit exceeded. Maximum ${config.maxRequests} confessions per day.`
      );
    }
  } else if (action === "tip") {
    // Count tips sent in the time window
    const { count, error } = await supabaseServer
      .from("tips")
      .select("*", { count: "exact", head: true })
      .eq("tipper_address", userAddress)
      .gte("created_at", windowStart.toISOString());

    if (error) {
      console.error("Rate limit check error:", error);
      // Fail open - allow the request if we can't check the limit
      return true;
    }

    if (count !== null && count >= config.maxRequests) {
      throw new RateLimitError(
        `Rate limit exceeded. Maximum ${config.maxRequests} tips per day.`
      );
    }
  }

  return true;
}

// Rate limit configurations as per requirements
export const RATE_LIMITS = {
  confession: {
    maxRequests: 10,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  tip: {
    maxRequests: 50,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
};
