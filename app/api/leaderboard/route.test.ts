import { describe, it, expect, beforeEach, vi } from "vitest";
import fc from "fast-check";
import { GET } from "./route";
import { NextRequest } from "next/server";
import * as confessionsDb from "@/lib/db/confessions";
import type { Confession } from "@/types";

// Mock database module
vi.mock("@/lib/db/confessions");

// Helper to create mock confession
function createMockConfession(
  id: string,
  totalTips: number,
  tipCount: number
): Confession {
  return {
    id,
    text: "Test confession",
    category: "funny",
    author_address: "0x1234567890123456789012345678901234567890",
    total_tips: totalTips,
    tip_count: tipCount,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe("Leaderboard API - Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: confession-tip, Property 12: Leaderboard Sorting
  describe("Property 12: Leaderboard Sorting", () => {
    it("should sort confessions by total_tips DESC, then tip_count DESC for any valid data", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              totalTips: fc.double({ min: 0, max: 1000, noNaN: true }),
              tipCount: fc.integer({ min: 0, max: 1000 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (confessionData) => {
            // Create mock confessions from generated data
            const confessions = confessionData.map((data) =>
              createMockConfession(data.id, data.totalTips, data.tipCount)
            );

            // Sort confessions as the database would (by total_tips DESC, then tip_count DESC)
            const sortedConfessions = [...confessions].sort((a, b) => {
              if (a.total_tips !== b.total_tips) {
                return b.total_tips - a.total_tips;
              }
              return b.tip_count - a.tip_count;
            });

            // Mock the getLeaderboard function with sorted data
            vi.mocked(confessionsDb.getLeaderboard).mockResolvedValue(
              sortedConfessions
            );

            // Create request
            const request = new NextRequest(
              "http://localhost:3000/api/leaderboard"
            );

            // Execute
            const response = await GET(request);
            const data = await response.json();

            // Verify: Response should be successful
            expect(response.status).toBe(200);
            expect(data).toHaveProperty("leaderboard");

            const leaderboard = data.leaderboard;

            // Verify: Leaderboard should be sorted by total_tips DESC, then tip_count DESC
            for (let i = 0; i < leaderboard.length - 1; i++) {
              const current = leaderboard[i];
              const next = leaderboard[i + 1];

              // Either current has more tips, or same tips but more tip count
              const isCorrectOrder =
                current.total_tips > next.total_tips ||
                (current.total_tips === next.total_tips &&
                  current.tip_count >= next.tip_count);

              expect(isCorrectOrder).toBe(true);
            }

            // Verify: Rank numbers should be sequential starting from 1
            leaderboard.forEach((item: { rank: number }, index: number) => {
              expect(item.rank).toBe(index + 1);
            });

            // Verify: Should not exceed 50 items
            expect(leaderboard.length).toBeLessThanOrEqual(50);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: confession-tip, Property 13: Leaderboard Display Completeness
  describe("Property 13: Leaderboard Display Completeness", () => {
    it("should include all required fields for any leaderboard entry", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              text: fc.string({ minLength: 10, maxLength: 500 }),
              category: fc.constantFrom(
                "funny",
                "deep",
                "relationship",
                "work",
                "random",
                "wholesome",
                "regret"
              ),
              totalTips: fc.double({ min: 0, max: 1000, noNaN: true }),
              tipCount: fc.integer({ min: 0, max: 1000 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (confessionData) => {
            // Create mock confessions
            const confessions = confessionData.map((data) => ({
              id: data.id,
              text: data.text,
              category: data.category as "funny" | "deep" | "relationship" | "work" | "random" | "wholesome" | "regret",
              author_address: "0x1234567890123456789012345678901234567890",
              total_tips: data.totalTips,
              tip_count: data.tipCount,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));

            // Mock the getLeaderboard function
            vi.mocked(confessionsDb.getLeaderboard).mockResolvedValue(
              confessions
            );

            // Create request
            const request = new NextRequest(
              "http://localhost:3000/api/leaderboard"
            );

            // Execute
            const response = await GET(request);
            const data = await response.json();

            const leaderboard = data.leaderboard;

            // Verify: Each entry should have all required fields
            leaderboard.forEach((entry: { rank: number; text: string; category: string; total_tips: number; tip_count: number }) => {
              // Required fields from Requirements 5.2
              expect(entry).toHaveProperty("rank");
              expect(entry).toHaveProperty("text");
              expect(entry).toHaveProperty("category");
              expect(entry).toHaveProperty("total_tips");
              expect(entry).toHaveProperty("tip_count");

              // Verify types
              expect(typeof entry.rank).toBe("number");
              expect(typeof entry.text).toBe("string");
              expect(typeof entry.category).toBe("string");
              expect(typeof entry.total_tips).toBe("number");
              expect(typeof entry.tip_count).toBe("number");

              // Verify rank is positive
              expect(entry.rank).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
