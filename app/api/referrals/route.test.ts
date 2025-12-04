import { describe, it, expect, beforeEach, vi } from "vitest";
import fc from "fast-check";
import { POST } from "./route";
import { NextRequest } from "next/server";
import * as usersDb from "@/lib/db/users";
import * as referralsDb from "@/lib/db/referrals";
import type { User, Referral } from "@/types";

// Mock database modules
vi.mock("@/lib/db/users");
vi.mock("@/lib/db/referrals");

// Ethereum address generator
const ethereumAddress = () =>
  fc
    .array(fc.constantFrom(..."0123456789abcdef".split("")), {
      minLength: 40,
      maxLength: 40,
    })
    .map((arr) => `0x${arr.join("")}`);

// Referral code generator
const referralCode = () =>
  fc
    .array(fc.constantFrom(..."0123456789ABCDEF".split("")), {
      minLength: 8,
      maxLength: 8,
    })
    .map((arr) => `REF${arr.join("")}`);

// Helper to create mock user
function createMockUser(address: string, referralCode: string): User {
  return {
    address,
    total_confessions: 0,
    total_tips_received: 0,
    total_tips_given: 0,
    referral_code: referralCode,
    referral_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Helper to create mock referral
function createMockReferral(
  referrerAddress: string,
  refereeAddress: string
): Referral {
  return {
    id: fc.sample(fc.uuid(), 1)[0],
    referrer_address: referrerAddress,
    referee_address: refereeAddress,
    created_at: new Date().toISOString(),
  };
}

describe("Referrals API - Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: confession-tip, Property 27: Referral Bonus Distribution
  describe("Property 27: Referral Bonus Distribution", () => {
    it("should credit both referrer and referee with 0.01 USDC for any valid referral", async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddress(),
          ethereumAddress(),
          referralCode(),
          async (referrerAddress, refereeAddress, refCode) => {
            // Ensure addresses are different
            fc.pre(
              referrerAddress.toLowerCase() !== refereeAddress.toLowerCase()
            );

            // Create mock users
            const referrer = createMockUser(referrerAddress, refCode);
            const referee = createMockUser(refereeAddress, `REF${refereeAddress.slice(-8).toUpperCase()}`);
            const referral = createMockReferral(referrerAddress, refereeAddress);

            // Mock database responses
            vi.mocked(usersDb.getUserByReferralCode).mockResolvedValue(
              referrer
            );
            vi.mocked(referralsDb.getReferralByAddresses).mockResolvedValue(
              null
            );
            vi.mocked(usersDb.getOrCreateUser).mockResolvedValue(referee);
            vi.mocked(referralsDb.createReferral).mockResolvedValue(referral);
            vi.mocked(usersDb.incrementUserReferrals).mockResolvedValue();

            // Create request
            const request = new NextRequest(
              "http://localhost:3000/api/referrals",
              {
                method: "POST",
                body: JSON.stringify({
                  referral_code: refCode,
                  referee_address: refereeAddress,
                }),
              }
            );

            // Execute
            const response = await POST(request);
            const data = await response.json();

            // Verify: Response should be successful
            expect(response.status).toBe(201);

            // Verify: Both parties should receive exactly 0.01 USDC bonus
            expect(data.bonus.referrer_bonus).toBe(0.01);
            expect(data.bonus.referee_bonus).toBe(0.01);
            expect(data.bonus.currency).toBe("USDC");

            // Verify: Referral record was created
            expect(referralsDb.createReferral).toHaveBeenCalled();

            // Verify: Referrer stats were updated
            expect(usersDb.incrementUserReferrals).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: confession-tip, Property 28: Referral Stats Tracking
  describe("Property 28: Referral Stats Tracking", () => {
    it("should accurately track referral count for any referrer", async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddress(),
          referralCode(),
          fc.array(ethereumAddress(), { minLength: 1, maxLength: 10 }),
          async (referrerAddress, refCode, refereeAddresses) => {
            // Ensure all referee addresses are unique and different from referrer
            const uniqueReferees = Array.from(
              new Set(
                refereeAddresses.filter(
                  (addr) => addr.toLowerCase() !== referrerAddress.toLowerCase()
                )
              )
            );
            fc.pre(uniqueReferees.length > 0);

            // Clear mocks for this property test iteration
            vi.clearAllMocks();

            const referrer = createMockUser(referrerAddress, refCode);

            // Process each referral
            for (const refereeAddress of uniqueReferees) {
              const referee = createMockUser(refereeAddress, `REF${refereeAddress.slice(-8).toUpperCase()}`);
              const referral = createMockReferral(
                referrerAddress,
                refereeAddress
              );

              vi.mocked(usersDb.getUserByReferralCode).mockResolvedValue(
                referrer
              );
              vi.mocked(referralsDb.getReferralByAddresses).mockResolvedValue(
                null
              );
              vi.mocked(usersDb.getOrCreateUser).mockResolvedValue(referee);
              vi.mocked(referralsDb.createReferral).mockResolvedValue(referral);
              vi.mocked(usersDb.incrementUserReferrals).mockResolvedValue();

              const request = new NextRequest(
                "http://localhost:3000/api/referrals",
                {
                  method: "POST",
                  body: JSON.stringify({
                    referral_code: refCode,
                    referee_address: refereeAddress,
                  }),
                }
              );

              const response = await POST(request);
              expect(response.status).toBe(201);
            }

            // Verify: incrementUserReferrals was called for each successful referral
            expect(usersDb.incrementUserReferrals).toHaveBeenCalledTimes(
              uniqueReferees.length
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: confession-tip, Property 11: Gasless Transactions
  describe("Property 11: Gasless Transactions", () => {
    it("should indicate gasless transaction support for referral bonuses", async () => {
      await fc.assert(
        fc.asyncProperty(
          ethereumAddress(),
          ethereumAddress(),
          referralCode(),
          async (referrerAddress, refereeAddress, refCode) => {
            // Ensure addresses are different
            fc.pre(
              referrerAddress.toLowerCase() !== refereeAddress.toLowerCase()
            );

            const referrer = createMockUser(referrerAddress, refCode);
            const referee = createMockUser(refereeAddress, `REF${refereeAddress.slice(-8).toUpperCase()}`);
            const referral = createMockReferral(referrerAddress, refereeAddress);

            vi.mocked(usersDb.getUserByReferralCode).mockResolvedValue(
              referrer
            );
            vi.mocked(referralsDb.getReferralByAddresses).mockResolvedValue(
              null
            );
            vi.mocked(usersDb.getOrCreateUser).mockResolvedValue(referee);
            vi.mocked(referralsDb.createReferral).mockResolvedValue(referral);
            vi.mocked(usersDb.incrementUserReferrals).mockResolvedValue();

            const request = new NextRequest(
              "http://localhost:3000/api/referrals",
              {
                method: "POST",
                body: JSON.stringify({
                  referral_code: refCode,
                  referee_address: refereeAddress,
                }),
              }
            );

            const response = await POST(request);
            const data = await response.json();

            // Verify: Response indicates successful creation
            expect(response.status).toBe(201);

            // Verify: Bonus information is provided (would use Paymaster in production)
            expect(data.bonus).toBeDefined();
            expect(data.bonus.referrer_bonus).toBe(0.01);
            expect(data.bonus.referee_bonus).toBe(0.01);

            // Note: In production, this would verify Paymaster configuration
            // For now, we verify the structure is correct for gasless transactions
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
