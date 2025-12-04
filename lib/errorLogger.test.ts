import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  logError,
  logApiError,
  logNetworkError,
  logTransactionError,
  getRecentErrors,
  getErrorsByType,
  clearErrorLogs,
  getUserFriendlyMessage,
  ERROR_MESSAGES,
} from "./errorLogger";

/**
 * Property 31: Error Logging
 * Validates: Requirements 13.4
 *
 * For any error that occurs, the system should log it with
 * appropriate context and severity.
 */
describe("Property 31: Error Logging", () => {
  beforeEach(() => {
    clearErrorLogs();
  });

  /**
   * Feature: confession-tip, Property 31: Error Logging
   * Validates: Requirements 13.4
   *
   * For any error logged, it should be stored with a unique ID and timestamp.
   */
  it("should log errors with unique ID and timestamp", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (errorMessage) => {
          clearErrorLogs();

          const error = new Error(errorMessage);
          const errorId = logError(error);

          const logs = getRecentErrors(1);
          expect(logs.length).toBe(1);
          expect(logs[0].id).toBe(errorId);
          expect(logs[0].message).toBe(errorMessage);
          expect(logs[0].timestamp).toBeDefined();
          expect(new Date(logs[0].timestamp).getTime()).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 31: Error Logging
   * Validates: Requirements 13.4
   *
   * For any error logged with context, the context should be preserved.
   */
  it("should preserve error context", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.record({
          userId: fc.string(),
          action: fc.string(),
          timestamp: fc.integer(),
        }),
        async (errorMessage, context) => {
          clearErrorLogs();

          const error = new Error(errorMessage);
          logError(error, { context });

          const logs = getRecentErrors(1);
          expect(logs[0].context).toEqual(context);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 31: Error Logging
   * Validates: Requirements 13.4
   *
   * For any error logged with severity, the severity should be preserved.
   */
  it("should preserve error severity", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom("low", "medium", "high", "critical") as fc.Arbitrary<
          "low" | "medium" | "high" | "critical"
        >,
        async (errorMessage, severity) => {
          clearErrorLogs();

          const error = new Error(errorMessage);
          logError(error, { severity });

          const logs = getRecentErrors(1);
          expect(logs[0].severity).toBe(severity);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 31: Error Logging
   * Validates: Requirements 13.4
   *
   * API errors should be logged with endpoint and status code.
   */
  it("should log API errors with endpoint and status code", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.integer({ min: 400, max: 599 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (endpoint, statusCode, message) => {
          clearErrorLogs();

          logApiError(endpoint, statusCode, message);

          const logs = getErrorsByType("api");
          expect(logs.length).toBe(1);
          expect(logs[0].context?.endpoint).toBe(endpoint);
          expect(logs[0].context?.statusCode).toBe(statusCode);
          expect(logs[0].type).toBe("api");
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 31: Error Logging
   * Validates: Requirements 13.4
   *
   * Network errors should be logged with URL.
   */
  it("should log network errors with URL", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (url, message) => {
          clearErrorLogs();

          logNetworkError(url, message);

          const logs = getErrorsByType("network");
          expect(logs.length).toBe(1);
          expect(logs[0].context?.url).toBe(url);
          expect(logs[0].type).toBe("network");
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 31: Error Logging
   * Validates: Requirements 13.4
   *
   * Transaction errors should be logged with transaction hash.
   */
  it("should log transaction errors with transaction hash", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .array(
            fc.constantFrom(
              "0",
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "a",
              "b",
              "c",
              "d",
              "e",
              "f"
            ),
            { minLength: 64, maxLength: 64 }
          )
          .map((chars) => "0x" + chars.join("")),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (txHash, message) => {
          clearErrorLogs();

          logTransactionError(txHash, message);

          const logs = getErrorsByType("transaction");
          expect(logs.length).toBe(1);
          expect(logs[0].context?.transactionHash).toBe(txHash);
          expect(logs[0].type).toBe("transaction");
          expect(logs[0].severity).toBe("high");
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 31: Error Logging
   * Validates: Requirements 13.4
   *
   * Error logs should be retrievable in order (most recent first).
   */
  it("should retrieve errors in order (most recent first)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
          minLength: 3,
          maxLength: 10,
        }),
        async (errorMessages) => {
          clearErrorLogs();

          // Log errors in order
          for (const msg of errorMessages) {
            logError(new Error(msg));
          }

          const logs = getRecentErrors(errorMessages.length);

          // Most recent should be first
          expect(logs.length).toBe(errorMessages.length);
          expect(logs[0].message).toBe(errorMessages[errorMessages.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 31: Error Logging
   * Validates: Requirements 13.4
   *
   * User-friendly messages should be returned for known error patterns.
   */
  it("should return user-friendly messages for known error patterns", async () => {
    const errorPatterns = [
      { input: "network error occurred", expected: ERROR_MESSAGES.NETWORK_ERROR },
      { input: "fetch failed", expected: ERROR_MESSAGES.NETWORK_ERROR },
      { input: "request timeout", expected: ERROR_MESSAGES.TIMEOUT_ERROR },
      { input: "rate limit exceeded", expected: ERROR_MESSAGES.RATE_LIMITED },
      { input: "429 too many requests", expected: ERROR_MESSAGES.RATE_LIMITED },
      { input: "insufficient balance", expected: ERROR_MESSAGES.INSUFFICIENT_FUNDS },
      { input: "user rejected transaction", expected: ERROR_MESSAGES.USER_REJECTED },
      { input: "content flagged by moderation", expected: ERROR_MESSAGES.CONTENT_FLAGGED },
    ];

    for (const { input, expected } of errorPatterns) {
      const result = getUserFriendlyMessage(new Error(input));
      expect(result).toBe(expected);
    }
  });

  /**
   * Feature: confession-tip, Property 31: Error Logging
   * Validates: Requirements 13.4
   *
   * Short, user-friendly error messages should be preserved.
   */
  it("should preserve short user-friendly error messages", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes("Error:")),
        async (message) => {
          const result = getUserFriendlyMessage(message);
          expect(result).toBe(message);
        }
      ),
      { numRuns: 100 }
    );
  });
});
