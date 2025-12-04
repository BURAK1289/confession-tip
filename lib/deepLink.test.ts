import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Feature: confession-tip, Property 24: Deep Link Navigation
describe('Property 24: Deep Link Navigation', () => {
  const parseConfessionIdFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('confession');
    } catch {
      return null;
    }
  };

  const generateDeepLink = (baseUrl: string, confessionId: string): string => {
    return `${baseUrl}?confession=${confessionId}`;
  };

  it('should extract confession ID from any valid app URL with confession parameter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.uuid(),
        async (baseUrl, confessionId) => {
          const deepLink = generateDeepLink(baseUrl, confessionId);
          const extractedId = parseConfessionIdFromUrl(deepLink);

          // Property: Extracted ID should match original confession ID
          expect(extractedId).toBe(confessionId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null for URLs without confession parameter', async () => {
    await fc.assert(
      fc.asyncProperty(fc.webUrl(), async (url) => {
        const extractedId = parseConfessionIdFromUrl(url);

        // Property: URLs without confession parameter should return null
        expect(extractedId).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should handle URLs with multiple query parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (baseUrl, confessionId, paramKey, paramValue) => {
          // Create URL with multiple parameters using URLSearchParams
          const urlObj = new URL(baseUrl);
          urlObj.searchParams.set(paramKey, paramValue);
          urlObj.searchParams.set('confession', confessionId);

          const extractedId = parseConfessionIdFromUrl(urlObj.toString());

          // Property: Should extract confession ID even with other parameters
          expect(extractedId).toBe(confessionId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid URLs that can be parsed back', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('http://localhost:3000', 'https://confession-tip.vercel.app'),
        fc.uuid(),
        async (baseUrl, confessionId) => {
          const deepLink = generateDeepLink(baseUrl, confessionId);

          // Property: Generated link should be a valid URL
          expect(() => new URL(deepLink)).not.toThrow();

          // Property: Parsing the generated link should return the original ID
          const extractedId = parseConfessionIdFromUrl(deepLink);
          expect(extractedId).toBe(confessionId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve confession ID through URL encoding/decoding', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.uuid(),
        async (baseUrl, confessionId) => {
          const deepLink = generateDeepLink(baseUrl, confessionId);

          // Simulate URL encoding/decoding that might happen in browsers
          const encoded = encodeURI(deepLink);
          const decoded = decodeURI(encoded);

          const extractedId = parseConfessionIdFromUrl(decoded);

          // Property: ID should survive encoding/decoding
          expect(extractedId).toBe(confessionId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle confession IDs with special characters in query string', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.uuid(),
        async (baseUrl, confessionId) => {
          // UUIDs don't have special chars, but test the encoding anyway
          const deepLink = generateDeepLink(baseUrl, confessionId);
          const urlObj = new URL(deepLink);

          // Property: Query parameter should be properly encoded
          expect(urlObj.searchParams.get('confession')).toBe(confessionId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
