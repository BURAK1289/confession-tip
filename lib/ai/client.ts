import OpenAI from "openai";
import {
  CONFESSION_CATEGORIES,
  ModerationResult,
  CategorizationResult,
} from "@/types";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxAttempts Maximum number of retry attempts
 * @param baseDelay Base delay in milliseconds
 * @returns Result of the function
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Moderate confession content using OpenAI Moderation API
 * Requirements: 1.3, 2.1, 2.2
 * @param text Confession text to moderate
 * @returns Moderation result with flagged status and categories
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    const response = await retryWithBackoff(async () => {
      return await openai.moderations.create({
        model: "omni-moderation-latest",
        input: text,
      });
    });

    const result = response.results[0];

    // Check if content is flagged for any prohibited categories
    const flagged =
      result.categories.hate ||
      result.categories.harassment ||
      result.categories["self-harm"] ||
      result.categories["sexual/minors"] ||
      result.categories.violence;

    // Build reason string if flagged
    let reason: string | undefined;
    if (flagged) {
      const flaggedCategories: string[] = [];
      if (result.categories.hate) flaggedCategories.push("hate speech");
      if (result.categories.harassment) flaggedCategories.push("harassment");
      if (result.categories["self-harm"]) flaggedCategories.push("self-harm");
      if (result.categories["sexual/minors"])
        flaggedCategories.push("inappropriate sexual content");
      if (result.categories.violence) flaggedCategories.push("violence");

      reason = `Content flagged for: ${flaggedCategories.join(", ")}`;
    }

    return {
      flagged,
      categories: {
        hate: result.categories.hate,
        harassment: result.categories.harassment,
        self_harm: result.categories["self-harm"],
        sexual: result.categories["sexual/minors"],
        violence: result.categories.violence,
      },
      reason,
    };
  } catch (error) {
    console.error("OpenAI moderation error:", error);
    // Fallback: reject on error to be safe
    return {
      flagged: true,
      categories: {
        hate: false,
        harassment: false,
        self_harm: false,
        sexual: false,
        violence: false,
      },
      reason: "Moderation service temporarily unavailable. Please try again.",
    };
  }
}

/**
 * Categorize confession content using OpenAI Chat API
 * Requirements: 2.3, 2.4
 * @param text Confession text to categorize
 * @returns Categorization result with category and confidence
 */
export async function categorizeContent(
  text: string
): Promise<CategorizationResult> {
  try {
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a content categorization assistant. Categorize the following confession into exactly ONE of these categories: ${CONFESSION_CATEGORIES.join(", ")}.

Category definitions:
- funny: Humorous, lighthearted, amusing confessions
- deep: Philosophical, introspective, meaningful thoughts
- relationship: Romance, dating, love, breakups
- work: Job, career, workplace situations
- random: Miscellaneous, doesn't fit other categories
- wholesome: Heartwarming, positive, uplifting
- regret: Things the person wishes they hadn't done or said

Respond with ONLY the category name, nothing else.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 10,
      });
    });

    const categoryText = response.choices[0]?.message?.content?.trim().toLowerCase();

    // Validate that the response is a valid category
    const category = CONFESSION_CATEGORIES.find((cat) => cat === categoryText);

    if (!category) {
      // Fallback to "random" if AI returns invalid category
      console.warn(
        `Invalid category returned by AI: ${categoryText}. Falling back to "random".`
      );
      return {
        category: "random",
        confidence: 0.5,
      };
    }

    // Calculate confidence based on finish_reason
    const confidence = response.choices[0]?.finish_reason === "stop" ? 0.9 : 0.7;

    return {
      category,
      confidence,
    };
  } catch (error) {
    console.error("OpenAI categorization error:", error);
    // Fallback: use "random" category on error
    return {
      category: "random",
      confidence: 0.5,
    };
  }
}

/**
 * Combined function to moderate and categorize content
 * This is the main function to use when processing new confessions
 * Requirements: 1.3, 1.4, 2.1, 2.2, 2.3, 2.4
 * @param text Confession text to process
 * @returns Object with moderation and categorization results
 */
export async function processConfessionContent(text: string): Promise<{
  moderation: ModerationResult;
  categorization: CategorizationResult | null;
}> {
  // First, moderate the content
  const moderation = await moderateContent(text);

  // Only categorize if content passes moderation
  let categorization: CategorizationResult | null = null;
  if (!moderation.flagged) {
    categorization = await categorizeContent(text);
  }

  return {
    moderation,
    categorization,
  };
}
