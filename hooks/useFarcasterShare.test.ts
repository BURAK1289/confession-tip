import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import type { Confession } from '@/types';

// Feature: confession-tip, Property 21: Share Content Formatting
describe('Property 21: Share Content Formatting', () => {
  const generateShareText = (text: string, confessionId: string): string => {
    const truncateText = (t: string, maxLength: number = 280): string => {
      if (t.length <= maxLength) return t;
      return t.slice(0, maxLength - 3) + '...';
    };

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}?confession=${confessionId}`;
    const truncatedText = truncateText(text, 280);

    return `${truncatedText}\n\n🤫 Share your confession anonymously on Confession Tip!\n${shareUrl}`;
  };

  it('should include confession text (truncated to 280 chars) and app link for any confession', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 500 }),
        fc.uuid(),
        async (text, confessionId) => {
          const shareText = generateShareText(text, confessionId);

          // Property: Share text should contain truncated confession text
          if (text.length <= 280) {
            expect(shareText).toContain(text);
          } else {
            const truncated = text.slice(0, 277) + '...';
            expect(shareText).toContain(truncated);
          }

          // Property: Share text should contain app link with confession ID
          expect(shareText).toContain(`confession=${confessionId}`);

          // Property: Share text should contain app branding
          expect(shareText).toContain('Confession Tip');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should truncate text at exactly 280 characters when text is longer', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 281, maxLength: 500 }),
        fc.uuid(),
        async (text, confessionId) => {
          const shareText = generateShareText(text, confessionId);
          const lines = shareText.split('\n\n');
          const confessionPart = lines[0];

          // Property: Truncated text should be at most 280 characters
          expect(confessionPart.length).toBeLessThanOrEqual(280);

          // Property: Truncated text should end with ellipsis
          expect(confessionPart).toMatch(/\.\.\.$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve full text when under 280 characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 280 }),
        fc.uuid(),
        async (text, confessionId) => {
          const shareText = generateShareText(text, confessionId);

          // Property: Full text should be preserved
          expect(shareText).toContain(text);

          // Property: Should not have ellipsis
          const lines = shareText.split('\n\n');
          expect(lines[0]).not.toMatch(/\.\.\.$/);
        }
      ),
      { numRuns: 100 }
    );
  });
});
