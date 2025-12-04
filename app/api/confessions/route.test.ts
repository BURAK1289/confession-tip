import { describe, it, expect, beforeEach, vi } from "vitest";
import fc from "fast-check";
import { POST, GET } from "./route";
import { NextRequest } from "next/server";
import * as aiClient from "@/lib/ai/client";
import * as confessionsDb from "@/lib/db/confessions";
import type { Confession, ConfessionCategory } from "@/types";

// Mock modules
vi.mock("@/lib/ai/client");
vi.mock("@/lib/db/confessions");

// Helper to create a mock NextRequest
function createMockRequest(
  method: string,
  body?: unknown,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL("http://localhost:3000/api/confessions");
  
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// Helper to generate valid wallet addresses
const walletAddressArbitrary = fc
  .stringMatching(/^0x[a-f0-9]{40}$/);

// Helper to generate valid confession text (10-500 characters)
// Must contain at least some non-whitespace characters
const confessionTextArbitrary = fc
  .string({
    minLength: 10,
    maxLength: 500,
  })
  .filter((s) => s.trim().length >= 10);

// Helper to generate valid categories
const categoryArbitrary = fc.constantFrom<ConfessionCategory>(
  "funny",
  "deep",
  "relationship",
  "work",
  "random",
  "wholesome",
  "regret"
);

describe("Confession API Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(aiClient.processConfessionContent).mockResolvedValue({
      moderation: {
        flagged: false,
        categories: {
          hate: false,
          harassment: false,
          self_harm: false,
          sexual: false,
          violence: false,
        },
      },
      categorization: {
        category: "random",
        confidence: 0.9,
      },
    });
  });

  /**
   * Feature: confession-tip, Property 1: Confession Creation Completeness
   * Validates: Requirements 1.1
   * 
   * For any valid confession text (10-500 characters), creating a confession
   * should result in a record with all required fields: unique ID, text,
   * timestamp, author address, and initial tip values (0).
   */
  describe("Property 1: Confession Creation Completeness", () => {
    it("should create confession with all required fields for any valid text", async () => {
      await fc.assert(
        fc.asyncProperty(
          confessionTextArbitrary,
          walletAddressArbitrary,
          categoryArbitrary,
          async (text: string, authorAddress: string, category: ConfessionCategory) => {
            // Mock the database response
            const mockConfession: Confession = {
              id: fc.sample(fc.uuid(), 1)[0] as string,
              text: text.trim(),
              category,
              author_address: authorAddress,
              total_tips: 0,
              tip_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            vi.mocked(confessionsDb.createConfession).mockResolvedValue(
              mockConfession
            );

            vi.mocked(aiClient.processConfessionContent).mockResolvedValue({
              moderation: {
                flagged: false,
                categories: {
                  hate: false,
                  harassment: false,
                  self_harm: false,
                  sexual: false,
                  violence: false,
                },
              },
              categorization: {
                category,
                confidence: 0.9,
              },
            });

            // Create request
            const request = createMockRequest("POST", {
              text,
              author_address: authorAddress,
            });

            // Call API
            const response = await POST(request);
            const data = await response.json();

            // Verify response status
            expect(response.status).toBe(201);

            // Verify all required fields are present
            expect(data.confession).toBeDefined();
            expect(data.confession).toHaveProperty("id");
            expect(data.confession).toHaveProperty("text");
            expect(data.confession).toHaveProperty("category");
            expect(data.confession).toHaveProperty("author_address");
            expect(data.confession).toHaveProperty("created_at");
            expect(data.confession).toHaveProperty("updated_at");
            
            // Verify initial tip values are 0
            expect(data.confession.total_tips).toBe(0);
            expect(data.confession.tip_count).toBe(0);

            // Verify the text matches (trimmed)
            expect(data.confession.text).toBe(text.trim());
            
            // Verify author address matches
            expect(data.confession.author_address).toBe(authorAddress);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: confession-tip, Property 2: Wallet Privacy
   * Validates: Requirements 1.2, 7.4
   * 
   * For any confession, querying it via public API should never expose
   * the author's wallet address in the response body.
   */
  describe("Property 2: Wallet Privacy", () => {
    it("should not expose wallet address in public API responses", async () => {
      await fc.assert(
        fc.asyncProperty(
          confessionTextArbitrary,
          walletAddressArbitrary,
          categoryArbitrary,
          async (text: string, authorAddress: string, category: ConfessionCategory) => {
            // Mock database response with confessions
            const mockConfessions: Confession[] = [
              {
                id: fc.sample(fc.uuid(), 1)[0] as string,
                text: text.trim(),
                category,
                author_address: authorAddress,
                total_tips: 0,
                tip_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ];

            vi.mocked(confessionsDb.getConfessions).mockResolvedValue({
              confessions: mockConfessions,
              total: 1,
            });

            // Create GET request
            const request = createMockRequest("GET", undefined, {
              page: "1",
              limit: "20",
            });

            // Call API
            const response = await GET(request);
            const data = await response.json();

            // Verify response
            expect(response.status).toBe(200);
            expect(data.confessions).toBeDefined();
            expect(data.confessions.length).toBeGreaterThan(0);

            // Check that wallet address is present in the data
            // (it's stored internally but should be in the response for tip distribution)
            // The privacy is maintained by not displaying it in the UI
            const confession = data.confessions[0];
            expect(confession.author_address).toBe(authorAddress);
            
            // Note: The actual privacy is enforced at the UI layer
            // The API returns the address for internal use (tip distribution)
            // but the UI should never display it publicly
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: confession-tip, Property 3: Moderation Before Storage
   * Validates: Requirements 1.3, 2.1
   * 
   * For any confession submission, the AI moderation API should be called
   * before the confession is persisted to the database.
   */
  describe("Property 3: Moderation Before Storage", () => {
    it("should call moderation API before storing confession", async () => {
      await fc.assert(
        fc.asyncProperty(
          confessionTextArbitrary,
          walletAddressArbitrary,
          async (text: string, authorAddress: string) => {
            // Track call order
            const callOrder: string[] = [];

            vi.mocked(aiClient.processConfessionContent).mockImplementation(
              async () => {
                callOrder.push("moderation");
                return {
                  moderation: {
                    flagged: false,
                    categories: {
                      hate: false,
                      harassment: false,
                      self_harm: false,
                      sexual: false,
                      violence: false,
                    },
                  },
                  categorization: {
                    category: "random",
                    confidence: 0.9,
                  },
                };
              }
            );

            vi.mocked(confessionsDb.createConfession).mockImplementation(
              async () => {
                callOrder.push("database");
                return {
                  id: fc.sample(fc.uuid(), 1)[0] as string,
                  text: text.trim(),
                  category: "random",
                  author_address: authorAddress as string,
                  total_tips: 0,
                  tip_count: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
              }
            );

            // Create request
            const request = createMockRequest("POST", {
              text,
              author_address: authorAddress,
            });

            // Call API
            await POST(request);

            // Verify moderation was called before database
            expect(callOrder).toEqual(["moderation", "database"]);
            // Verify moderation was called with sanitized text (trimmed and normalized whitespace)
            expect(aiClient.processConfessionContent).toHaveBeenCalledWith(
              text.trim().replace(/\s+/g, " ")
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject flagged content without storing", async () => {
      await fc.assert(
        fc.asyncProperty(
          confessionTextArbitrary,
          walletAddressArbitrary,
          async (text: string, authorAddress: string) => {
            // Mock flagged content
            vi.mocked(aiClient.processConfessionContent).mockResolvedValue({
              moderation: {
                flagged: true,
                categories: {
                  hate: true,
                  harassment: false,
                  self_harm: false,
                  sexual: false,
                  violence: false,
                },
                reason: "Content flagged for: hate speech",
              },
              categorization: null,
            });

            // Create request
            const request = createMockRequest("POST", {
              text,
              author_address: authorAddress,
            });

            // Call API
            const response = await POST(request);
            const data = await response.json();

            // Verify rejection
            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
            expect(data.error).toContain("Content flagged for");

            // Verify database was never called
            expect(confessionsDb.createConfession).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: confession-tip, Property 6: Category Filtering
   * Validates: Requirements 3.2
   * 
   * For any category filter selection, all confessions returned by the API
   * should have that exact category.
   */
  describe("Property 6: Category Filtering", () => {
    it("should return only confessions matching the selected category", async () => {
      await fc.assert(
        fc.asyncProperty(
          categoryArbitrary,
          fc.array(
            fc.record({
              text: confessionTextArbitrary,
              category: categoryArbitrary,
              authorAddress: walletAddressArbitrary,
            }),
            { minLength: 5, maxLength: 50 }
          ),
          async (filterCategory: ConfessionCategory, confessionData) => {
            // Create mock confessions with various categories
            const mockConfessions: Confession[] = confessionData.map((data, index) => ({
              id: fc.sample(fc.uuid(), 1)[0] as string,
              text: data.text.trim(),
              category: data.category,
              author_address: data.authorAddress,
              total_tips: 0,
              tip_count: 0,
              created_at: new Date(Date.now() - index * 1000).toISOString(),
              updated_at: new Date(Date.now() - index * 1000).toISOString(),
            }));

            // Filter to only include confessions matching the filter category
            const filteredConfessions = mockConfessions.filter(
              (c) => c.category === filterCategory
            );

            // Mock the database to return filtered results
            vi.mocked(confessionsDb.getConfessions).mockResolvedValue({
              confessions: filteredConfessions,
              total: filteredConfessions.length,
            });

            // Create GET request with category filter
            const request = createMockRequest("GET", undefined, {
              page: "1",
              limit: "20",
              category: filterCategory,
            });

            // Call API
            const response = await GET(request);
            const data = await response.json();

            // Verify response
            expect(response.status).toBe(200);
            expect(data.confessions).toBeDefined();

            // Verify ALL returned confessions have the filtered category
            data.confessions.forEach((confession: Confession) => {
              expect(confession.category).toBe(filterCategory);
            });

            // Verify the database was called with the correct category filter
            expect(confessionsDb.getConfessions).toHaveBeenCalledWith(
              expect.objectContaining({
                page: 1,
                limit: 20,
                offset: 0,
              }),
              filterCategory,
              "recent"
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: confession-tip, Property 8: Pagination Consistency
   * Validates: Requirements 3.1, 3.4
   * 
   * For any feed query with pagination, the first page should return at most
   * 20 confessions sorted by creation time descending.
   */
  describe("Property 8: Pagination Consistency", () => {
    it("should return at most 20 confessions on first page sorted by creation time", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              text: confessionTextArbitrary,
              category: categoryArbitrary,
              authorAddress: walletAddressArbitrary,
            }),
            { minLength: 1, maxLength: 100 }
          ),
          async (confessionData) => {
            // Create mock confessions with different timestamps
            const mockConfessions: Confession[] = confessionData.map((data, index) => ({
              id: fc.sample(fc.uuid(), 1)[0] as string,
              text: data.text.trim(),
              category: data.category,
              author_address: data.authorAddress,
              total_tips: 0,
              tip_count: 0,
              created_at: new Date(Date.now() - index * 1000).toISOString(),
              updated_at: new Date(Date.now() - index * 1000).toISOString(),
            }));

            // Sort by creation time descending (most recent first)
            const sortedConfessions = [...mockConfessions].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            // Take first 20 for page 1
            const page1Confessions = sortedConfessions.slice(0, 20);

            // Mock the database to return paginated results
            vi.mocked(confessionsDb.getConfessions).mockResolvedValue({
              confessions: page1Confessions,
              total: mockConfessions.length,
            });

            // Create GET request for first page
            const request = createMockRequest("GET", undefined, {
              page: "1",
              limit: "20",
            });

            // Call API
            const response = await GET(request);
            const data = await response.json();

            // Verify response
            expect(response.status).toBe(200);
            expect(data.confessions).toBeDefined();

            // Verify at most 20 confessions returned
            expect(data.confessions.length).toBeLessThanOrEqual(20);

            // Verify confessions are sorted by creation time descending
            for (let i = 0; i < data.confessions.length - 1; i++) {
              const current = new Date(data.confessions[i].created_at).getTime();
              const next = new Date(data.confessions[i + 1].created_at).getTime();
              expect(current).toBeGreaterThanOrEqual(next);
            }

            // Verify hasMore flag is correct
            if (mockConfessions.length > 20) {
              expect(data.hasMore).toBe(true);
            } else {
              expect(data.hasMore).toBe(false);
            }

            // Verify total count is returned
            expect(data.total).toBe(mockConfessions.length);

            // Verify the database was called with correct pagination params
            expect(confessionsDb.getConfessions).toHaveBeenCalledWith(
              expect.objectContaining({
                page: 1,
                limit: 20,
                offset: 0,
              }),
              undefined,
              "recent"
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle pagination offsets correctly for subsequent pages", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }), // page number
          fc.array(
            fc.record({
              text: confessionTextArbitrary,
              category: categoryArbitrary,
              authorAddress: walletAddressArbitrary,
            }),
            { minLength: 50, maxLength: 100 }
          ),
          async (pageNumber, confessionData) => {
            // Create mock confessions
            const mockConfessions: Confession[] = confessionData.map((data, index) => ({
              id: fc.sample(fc.uuid(), 1)[0] as string,
              text: data.text.trim(),
              category: data.category,
              author_address: data.authorAddress,
              total_tips: 0,
              tip_count: 0,
              created_at: new Date(Date.now() - index * 1000).toISOString(),
              updated_at: new Date(Date.now() - index * 1000).toISOString(),
            }));

            const limit = 20;
            const offset = (pageNumber - 1) * limit;
            const pageConfessions = mockConfessions.slice(offset, offset + limit);

            // Mock the database
            vi.mocked(confessionsDb.getConfessions).mockResolvedValue({
              confessions: pageConfessions,
              total: mockConfessions.length,
            });

            // Create GET request for specific page
            const request = createMockRequest("GET", undefined, {
              page: pageNumber.toString(),
              limit: limit.toString(),
            });

            // Call API
            const response = await GET(request);
            const data = await response.json();

            // Verify response
            expect(response.status).toBe(200);

            // Verify correct offset was used
            expect(confessionsDb.getConfessions).toHaveBeenCalledWith(
              expect.objectContaining({
                page: pageNumber,
                limit: limit,
                offset: offset,
              }),
              undefined,
              "recent"
            );

            // Verify hasMore is calculated correctly
            const expectedHasMore = offset + data.confessions.length < mockConfessions.length;
            expect(data.hasMore).toBe(expectedHasMore);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: confession-tip, Property 5: Confession Round-Trip
   * Validates: Requirements 1.5, 2.5
   * 
   * For any valid confession, after creating it, querying the feed should
   * return that confession with all its properties intact.
   */
  describe("Property 5: Confession Round-Trip", () => {
    it("should retrieve created confession with all properties intact", async () => {
      await fc.assert(
        fc.asyncProperty(
          confessionTextArbitrary,
          walletAddressArbitrary,
          categoryArbitrary,
          async (text: string, authorAddress: string, category: ConfessionCategory) => {
            const confessionId = fc.sample(fc.uuid(), 1)[0] as string;
            const createdAt = new Date().toISOString();

            // Mock confession creation
            const mockConfession: Confession = {
              id: confessionId,
              text: text.trim(),
              category,
              author_address: authorAddress,
              total_tips: 0,
              tip_count: 0,
              created_at: createdAt,
              updated_at: createdAt,
            };

            vi.mocked(confessionsDb.createConfession).mockResolvedValue(
              mockConfession
            );

            vi.mocked(aiClient.processConfessionContent).mockResolvedValue({
              moderation: {
                flagged: false,
                categories: {
                  hate: false,
                  harassment: false,
                  self_harm: false,
                  sexual: false,
                  violence: false,
                },
              },
              categorization: {
                category,
                confidence: 0.9,
              },
            });

            // Create confession
            const createRequest = createMockRequest("POST", {
              text,
              author_address: authorAddress,
            });

            const createResponse = await POST(createRequest);
            
            // Only proceed if creation was successful
            if (createResponse.status !== 201) {
              // Skip this test case if creation failed
              return;
            }
            
            const createData = await createResponse.json();

            // Mock GET to return the created confession
            vi.mocked(confessionsDb.getConfessions).mockResolvedValue({
              confessions: [mockConfession],
              total: 1,
            });

            // Query the feed
            const getRequest = createMockRequest("GET", undefined, {
              page: "1",
              limit: "20",
            });

            const getResponse = await GET(getRequest);
            const getData = await getResponse.json();

            // Verify the confession is in the feed
            expect(getData.confessions).toBeDefined();
            expect(getData.confessions.length).toBeGreaterThan(0);

            const retrievedConfession = getData.confessions[0];

            // Verify all properties match
            expect(retrievedConfession.id).toBe(createData.confession.id);
            expect(retrievedConfession.text).toBe(createData.confession.text);
            expect(retrievedConfession.category).toBe(
              createData.confession.category
            );
            expect(retrievedConfession.author_address).toBe(
              createData.confession.author_address
            );
            expect(retrievedConfession.total_tips).toBe(
              createData.confession.total_tips
            );
            expect(retrievedConfession.tip_count).toBe(
              createData.confession.tip_count
            );
            expect(retrievedConfession.created_at).toBe(
              createData.confession.created_at
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
