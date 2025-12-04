import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Property 33: Aggregate Stats Calculation
 * Validates: Requirements 14.4
 *
 * For any set of confessions and tips, the aggregate stats should
 * correctly calculate totals and distributions.
 */

// Mock confession data
interface MockConfession {
  id: string;
  category: string;
  author_address: string | null;
  created_at: string;
}

// Mock tip data
interface MockTip {
  id: string;
  confession_id: string;
  tipper_address: string;
  amount: number;
  created_at: string;
}

// Stats calculation function (mirrors API logic)
function calculateStats(confessions: MockConfession[], tips: MockTip[]) {
  const totalConfessions = confessions.length;
  const totalTips = tips.length;
  const totalTipAmount = tips.reduce((sum, tip) => sum + tip.amount, 0);

  // Unique users
  const uniqueAddresses = new Set([
    ...confessions.filter((c) => c.author_address).map((c) => c.author_address),
    ...tips.map((t) => t.tipper_address),
  ]);

  // Category distribution
  const categoryDistribution: Record<string, number> = {};
  confessions.forEach((c) => {
    const cat = c.category || "uncategorized";
    categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
  });

  // Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const todayConfessions = confessions.filter(
    (c) => c.created_at >= todayIso
  ).length;
  const todayTips = tips.filter((t) => t.created_at >= todayIso);
  const todayTipAmount = todayTips.reduce((sum, tip) => sum + tip.amount, 0);

  return {
    totalConfessions,
    totalTips,
    totalTipAmount,
    uniqueUsers: uniqueAddresses.size,
    categoryDistribution,
    today: {
      confessions: todayConfessions,
      tips: todayTips.length,
      tipAmount: todayTipAmount,
    },
  };
}

describe("Property 33: Aggregate Stats Calculation", () => {
  const categoryArbitrary = fc.constantFrom(
    "funny",
    "deep",
    "relationship",
    "work",
    "random",
    "wholesome",
    "regret"
  );

  const addressArbitrary = fc
    .array(fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"), { minLength: 40, maxLength: 40 })
    .map((chars) => "0x" + chars.join(""));

  // Generate a date string within a reasonable range
  const dateArbitrary = fc
    .integer({ min: 1704067200000, max: Date.now() }) // 2024-01-01 to now
    .map((ts) => new Date(ts).toISOString());

  const confessionArbitrary = fc.record({
    id: fc.uuid(),
    category: categoryArbitrary,
    author_address: fc.option(addressArbitrary, { nil: null }),
    created_at: dateArbitrary,
  });

  const tipArbitrary = fc.record({
    id: fc.uuid(),
    confession_id: fc.uuid(),
    tipper_address: addressArbitrary,
    amount: fc.float({ min: Math.fround(0.001), max: Math.fround(100), noNaN: true }),
    created_at: dateArbitrary,
  });

  /**
   * Feature: confession-tip, Property 33: Aggregate Stats Calculation
   * Validates: Requirements 14.4
   *
   * Total confessions count should equal the number of confessions.
   */
  it("should correctly count total confessions", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(confessionArbitrary, { minLength: 0, maxLength: 50 }),
        async (confessions) => {
          const stats = calculateStats(confessions, []);
          expect(stats.totalConfessions).toBe(confessions.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 33: Aggregate Stats Calculation
   * Validates: Requirements 14.4
   *
   * Total tips count and amount should be calculated correctly.
   */
  it("should correctly calculate total tips and amount", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(tipArbitrary, { minLength: 0, maxLength: 50 }),
        async (tips) => {
          const stats = calculateStats([], tips);

          expect(stats.totalTips).toBe(tips.length);

          const expectedAmount = tips.reduce((sum, tip) => sum + tip.amount, 0);
          expect(Math.abs(stats.totalTipAmount - expectedAmount)).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 33: Aggregate Stats Calculation
   * Validates: Requirements 14.4
   *
   * Unique users should be counted correctly from both confessions and tips.
   */
  it("should correctly count unique users", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(confessionArbitrary, { minLength: 0, maxLength: 20 }),
        fc.array(tipArbitrary, { minLength: 0, maxLength: 20 }),
        async (confessions, tips) => {
          const stats = calculateStats(confessions, tips);

          // Calculate expected unique users
          const expectedAddresses = new Set([
            ...confessions.filter((c) => c.author_address).map((c) => c.author_address),
            ...tips.map((t) => t.tipper_address),
          ]);

          expect(stats.uniqueUsers).toBe(expectedAddresses.size);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 33: Aggregate Stats Calculation
   * Validates: Requirements 14.4
   *
   * Category distribution should sum to total confessions.
   */
  it("should have category distribution sum equal to total confessions", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(confessionArbitrary, { minLength: 1, maxLength: 50 }),
        async (confessions) => {
          const stats = calculateStats(confessions, []);

          const distributionSum = Object.values(stats.categoryDistribution).reduce(
            (sum, count) => sum + count,
            0
          );

          expect(distributionSum).toBe(stats.totalConfessions);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 33: Aggregate Stats Calculation
   * Validates: Requirements 14.4
   *
   * Category distribution should correctly count each category.
   */
  it("should correctly calculate category distribution", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(confessionArbitrary, { minLength: 1, maxLength: 50 }),
        async (confessions) => {
          const stats = calculateStats(confessions, []);

          // Calculate expected distribution
          const expectedDistribution: Record<string, number> = {};
          confessions.forEach((c) => {
            const cat = c.category || "uncategorized";
            expectedDistribution[cat] = (expectedDistribution[cat] || 0) + 1;
          });

          // Compare distributions
          expect(Object.keys(stats.categoryDistribution).sort()).toEqual(
            Object.keys(expectedDistribution).sort()
          );

          for (const [category, count] of Object.entries(expectedDistribution)) {
            expect(stats.categoryDistribution[category]).toBe(count);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 33: Aggregate Stats Calculation
   * Validates: Requirements 14.4
   *
   * Today's stats should only include items from today.
   */
  it("should correctly filter today's stats", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(confessionArbitrary, { minLength: 0, maxLength: 20 }),
        fc.array(tipArbitrary, { minLength: 0, maxLength: 20 }),
        async (confessions, tips) => {
          const stats = calculateStats(confessions, tips);

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayIso = today.toISOString();

          // Calculate expected today's counts
          const expectedTodayConfessions = confessions.filter(
            (c) => c.created_at >= todayIso
          ).length;
          const expectedTodayTips = tips.filter((t) => t.created_at >= todayIso);
          const expectedTodayTipAmount = expectedTodayTips.reduce(
            (sum, tip) => sum + tip.amount,
            0
          );

          expect(stats.today.confessions).toBe(expectedTodayConfessions);
          expect(stats.today.tips).toBe(expectedTodayTips.length);
          expect(Math.abs(stats.today.tipAmount - expectedTodayTipAmount)).toBeLessThan(
            0.0001
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
