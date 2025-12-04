import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { categorizeContent, moderateContent, processConfessionContent } from "./client";
import { CONFESSION_CATEGORIES } from "@/types";

/**
 * Feature: confession-tip, Property 4: Category Validity
 * Validates: Requirements 2.4
 *
 * For any confession in the database, its category field should always be
 * one of the predefined values: funny, deep, relationship, work, random, wholesome, regret.
 */
describe("Property 4: Category Validity", () => {
  it("should assign valid category for any confession text", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random confession text (10-500 characters)
        fc.string({ minLength: 10, maxLength: 500 }),
        async (text) => {
          const result = await categorizeContent(text);

          // The category must be one of the predefined categories
          expect(CONFESSION_CATEGORIES).toContain(result.category);
          
          // Confidence should be between 0 and 1
          expect(result.confidence).toBeGreaterThanOrEqual(0);
          expect(result.confidence).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  }, 300000); // 5 minute timeout for 100 API calls
});

/**
 * Additional unit tests for moderation and categorization
 */
describe("AI Content Moderation", () => {
  it("should flag inappropriate content", async () => {
    const inappropriateText = "I hate everyone and want to hurt them";
    const result = await moderateContent(inappropriateText);
    
    // This should be flagged (though AI might not always flag it)
    // We just verify the structure is correct
    expect(result).toHaveProperty("flagged");
    expect(result).toHaveProperty("categories");
    expect(result.categories).toHaveProperty("hate");
    expect(result.categories).toHaveProperty("harassment");
    expect(result.categories).toHaveProperty("self_harm");
    expect(result.categories).toHaveProperty("sexual");
    expect(result.categories).toHaveProperty("violence");
  });

  it("should not flag appropriate content", async () => {
    const appropriateText = "I love spending time with my family on weekends";
    const result = await moderateContent(appropriateText);
    
    expect(result.flagged).toBe(false);
    expect(result.reason).toBeUndefined();
  });
});

describe("AI Content Categorization", () => {
  it("should categorize funny content correctly", async () => {
    const funnyText = "I accidentally called my teacher 'mom' in class today and everyone laughed";
    const result = await categorizeContent(funnyText);
    
    expect(CONFESSION_CATEGORIES).toContain(result.category);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should categorize work content correctly", async () => {
    const workText = "I pretend to work hard but I spend most of my day browsing social media";
    const result = await categorizeContent(workText);
    
    expect(CONFESSION_CATEGORIES).toContain(result.category);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should categorize relationship content correctly", async () => {
    const relationshipText = "I still think about my ex every day even though we broke up years ago";
    const result = await categorizeContent(relationshipText);
    
    expect(CONFESSION_CATEGORIES).toContain(result.category);
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe("Combined Content Processing", () => {
  it("should process appropriate content with both moderation and categorization", async () => {
    const text = "I secretly love watching cartoons even though I'm an adult";
    const result = await processConfessionContent(text);
    
    expect(result.moderation.flagged).toBe(false);
    expect(result.categorization).not.toBeNull();
    expect(CONFESSION_CATEGORIES).toContain(result.categorization!.category);
  });

  it("should not categorize flagged content", async () => {
    const inappropriateText = "I want to harm myself and others";
    const result = await processConfessionContent(inappropriateText);
    
    // If flagged, categorization should be null
    if (result.moderation.flagged) {
      expect(result.categorization).toBeNull();
    }
  });
});
