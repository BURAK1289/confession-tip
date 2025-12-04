import { describe, it, expect, beforeEach, vi } from "vitest";
import fc from "fast-check";
import { GET } from "./route";
import { NextRequest } from "next/server";
import * as usersDb from "@/lib/db/users";
import * as confessionsDb from "@/lib/db/confessions";
import type { User, Confession } from "@/types";

// Mock database modules
vi.mock("@/lib/db/users");
vi.mock("@/lib/db/confessions");

// Ethereum address generator
const ethereumAddress = () =>
  fc
    .array(fc.constantFrom(..."0123456789abcdef".split("")), {
      minLength: 40,
      maxLength: 40,
    })
    .map((arr) => `0x${arr.join("")}`);

// Helper to create mock user
function createMockUser(
  address: string,
  totalConfessions: number,
  totalTipsReceived: number,
  totalTipsGiven: number,
  referralCount: number
): User {
  return {
    address,
    total_confessions: totalConfessions,
    total_tips_received: totalTipsReceived,
    total_tips_given: totalTipsGiven,
    referral_code: `REF${address.slice(-8).toUpperCase()}`,
    referral_count: referralCount,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Helper to create mock confession
function createMockConfession(
  authorAddress: string,
  totalTips: number
): Confession {
  return {
    id: fc.sample(fc.uuid(), 1)[0],
    text: "Test confession",
    category: "funny",
    author_address: authorAddress,
    total_tips: totalTips,
    tip_count: Math.floor(totalTips / 0.01),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe("Profile API - Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: confession-tip, Property 18: Profile Stats Accuracy
  describe("Property 18: Profile Stats Accuracy", () => {
    it("should return accurate profile stats matching database aggregates for any user", async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddress(),
          fc.integer({ min: 0, max: 100 }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.integer({ min: 0, max: 50 }),
          async (
            address,
            totalConfessions,
            totalTipsReceived,
            totalTipsGiven,
            referralCount
          ) => {
            // Create mock user with specific stats
            const user = createMockUser(
              address,
              totalConfessions,
              totalTipsReceived,
              totalTipsGiven,
              referralCount
            );

            // Create mock confessions
            const confessions: Confession[] = [];
            for (let i = 0; i < totalConfessions; i++) {
              confessions.push(createMockConfession(address, 0));
            }

            // Mock database responses
            vi.mocked(usersDb.getOrCreateUser).mockResolvedValue(user);
            vi.mocked(confessionsDb.getConfessionsByAuthor).mockResolvedValue(
              confessions
            );

            // Create request
            const request = new NextRequest(
              `http://localhost:3000/api/profile?address=${address}`
            );

            // Execute
            const response = await GET(request);
            const data = await response.json();

            // Verify: Response should be successful
            expect(response.status).toBe(200);

            // Verify: Profile stats should match database values exactly
            expect(data.user.total_confessions).toBe(totalConfessions);
            expect(data.user.total_tips_received).toBeCloseTo(
              totalTipsReceived,
              6
            );
            expect(data.user.total_tips_given).toBeCloseTo(totalTipsGiven, 6);
            expect(data.user.referral_count).toBe(referralCount);

            // Verify: Confessions count should match
            expect(data.confessions.length).toBe(totalConfessions);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: confession-tip, Property 19: User Confession Filtering
  describe("Property 19: User Confession Filtering", () => {
    it("should only return confessions authored by the specified user", async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddress(),
          ethereumAddress(),
          fc.array(
            fc.record({
              totalTips: fc.double({ min: 0, max: 100, noNaN: true }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (userAddress, otherAddress, confessionData) => {
            // Ensure addresses are different
            fc.pre(userAddress.toLowerCase() !== otherAddress.toLowerCase());

            // Create mock user
            const user = createMockUser(
              userAddress,
              confessionData.length,
              0,
              0,
              0
            );

            // Create confessions for the user
            const userConfessions = confessionData.map((data) =>
              createMockConfession(userAddress, data.totalTips)
            );

            // Mock database responses
            vi.mocked(usersDb.getOrCreateUser).mockResolvedValue(user);
            vi.mocked(confessionsDb.getConfessionsByAuthor).mockResolvedValue(
              userConfessions
            );

            // Create request
            const request = new NextRequest(
              `http://localhost:3000/api/profile?address=${userAddress}`
            );

            // Execute
            const response = await GET(request);
            const data = await response.json();

            // Verify: All returned confessions should belong to the user
            data.confessions.forEach((confession: Confession) => {
              expect(confession.author_address.toLowerCase()).toBe(
                userAddress.toLowerCase()
              );
            });

            // Verify: No confessions from other users
            const hasOtherUserConfessions = data.confessions.some(
              (confession: Confession) =>
                confession.author_address.toLowerCase() ===
                otherAddress.toLowerCase()
            );
            expect(hasOtherUserConfessions).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: confession-tip, Property 26: Unique Referral Links
  describe("Property 26: Unique Referral Links", () => {
    it("should generate unique referral codes for different users", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(ethereumAddress(), { minLength: 2, maxLength: 10 }),
          async (addresses) => {
            // Ensure all addresses are unique
            const uniqueAddresses = Array.from(new Set(addresses));
            fc.pre(uniqueAddresses.length >= 2);

            const referralCodes = new Set<string>();

            // Test each address
            for (const address of uniqueAddresses) {
              const user = createMockUser(address, 0, 0, 0, 0);

              vi.mocked(usersDb.getOrCreateUser).mockResolvedValue(user);
              vi.mocked(confessionsDb.getConfessionsByAuthor).mockResolvedValue(
                []
              );

              const request = new NextRequest(
                `http://localhost:3000/api/profile?address=${address}`
              );

              const response = await GET(request);
              const data = await response.json();

              // Verify: Referral code exists
              expect(data.user.referral_code).toBeDefined();
              expect(typeof data.user.referral_code).toBe("string");
              expect(data.user.referral_code.length).toBeGreaterThan(0);

              // Verify: Referral code is unique
              expect(referralCodes.has(data.user.referral_code)).toBe(false);
              referralCodes.add(data.user.referral_code);
            }

            // Verify: All referral codes are unique
            expect(referralCodes.size).toBe(uniqueAddresses.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
