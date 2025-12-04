import { NextRequest, NextResponse } from "next/server";
import {
  validateConfessionText,
  validateWalletAddress,
  sanitizeText,
} from "@/lib/utils/validation";
import { processConfessionContent } from "@/lib/ai/client";
import { createConfession, getConfessions } from "@/lib/db/confessions";
import {
  ValidationError,
  RateLimitError,
  ModerationError,
  DatabaseError,
  type CreateConfessionRequest,
  type CreateConfessionResponse,
  type GetConfessionsResponse,
  type ConfessionCategory,
} from "@/types";

// In-memory rate limiting (for development - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_CONFESSIONS_PER_DAY = 10;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check rate limit for confession creation
 * Requirements: 12.5
 */
function checkRateLimit(address: string): void {
  const now = Date.now();
  const key = `confession:${address.toLowerCase()}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    // Create new rate limit record
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  if (record.count >= RATE_LIMIT_CONFESSIONS_PER_DAY) {
    const hoursRemaining = Math.ceil((record.resetAt - now) / (60 * 60 * 1000));
    throw new RateLimitError(
      `Rate limit exceeded. You can create ${RATE_LIMIT_CONFESSIONS_PER_DAY} confessions per day. Try again in ${hoursRemaining} hours.`
    );
  }

  // Increment count
  record.count += 1;
  rateLimitStore.set(key, record);
}

/**
 * POST /api/confessions - Create a new confession
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 12.5
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateConfessionRequest = await request.json();
    const { text, author_address } = body;

    // Validate inputs
    validateConfessionText(text);
    validateWalletAddress(author_address);

    // Check rate limit
    checkRateLimit(author_address);

    // Sanitize text
    const sanitizedText = sanitizeText(text);

    // Process content: moderate and categorize
    // Requirements: 1.3, 2.1 - Moderation before storage
    const { moderation, categorization } = await processConfessionContent(
      sanitizedText
    );

    // Reject if content is flagged
    // Requirements: 1.4, 2.2
    if (moderation.flagged) {
      throw new ModerationError(
        moderation.reason || "Content violates community guidelines"
      );
    }

    // Ensure we have a category (should always be present if moderation passed)
    if (!categorization) {
      throw new Error("Failed to categorize confession");
    }

    // Store confession in database
    // Requirements: 1.1, 1.2, 1.5, 2.4, 2.5
    const confession = await createConfession(
      sanitizedText,
      categorization.category,
      author_address
    );

    // Return created confession with all fields
    // Requirements: 1.1
    const response: CreateConfessionResponse = {
      confession,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/confessions - Fetch confessions with pagination and filtering
 * Requirements: 3.1, 3.2, 3.4
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category") as ConfessionCategory | null;
    const sort = (searchParams.get("sort") || "recent") as "recent" | "top";

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      throw new ValidationError("Invalid pagination parameters");
    }

    const offset = (page - 1) * limit;

    // Fetch confessions
    const { confessions, total } = await getConfessions(
      { page, limit, offset },
      category || undefined,
      sort
    );

    // Calculate if there are more results
    const hasMore = offset + confessions.length < total;

    const response: GetConfessionsResponse = {
      confessions,
      hasMore,
      total,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Error handler for API routes
 */
function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: error.message },
      { status: 429 }
    );
  }

  if (error instanceof ModerationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  if (error instanceof DatabaseError) {
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }

  // Unknown error
  return NextResponse.json(
    { error: "An unexpected error occurred. Please try again." },
    { status: 500 }
  );
}
