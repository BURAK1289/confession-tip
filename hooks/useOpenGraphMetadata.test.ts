import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { Confession, ConfessionCategory } from '@/types';

// Feature: confession-tip, Property 22: Share Metadata Generation
describe('Property 22: Share Metadata Generation', () => {
  const generateOpenGraphMetadata = (confession: Confession) => {
    const truncateText = (text: string, maxLength: number = 200): string => {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength - 3) + '...';
    };

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const truncatedText = truncateText(confession.text, 200);

    return {
      title: `Anonymous Confession - ${confession.category}`,
      description: truncatedText,
      image: `${baseUrl}/og-image.png`,
      url: `${baseUrl}?confession=${confession.id}`,
    };
  };

  const categoryArbitrary = fc.constantFrom<ConfessionCategory>(
    'funny',
    'deep',
    'relationship',
    'work',
    'random',
    'wholesome',
    'regret'
  );

  const confessionArbitrary = fc.record({
    id: fc.uuid(),
    text: fc.string({ minLength: 10, maxLength: 500 }),
    category: categoryArbitrary,
    author_address: fc.string({ minLength: 42, maxLength: 42 }).map((s) => '0x' + s.slice(2)),
    total_tips: fc.double({ min: 0, max: 1000 }),
    tip_count: fc.integer({ min: 0, max: 1000 }),
    created_at: fc.date().map((d) => d.toISOString()),
    updated_at: fc.date().map((d) => d.toISOString()),
  });

  it('should include confession preview and app information for any confession', async () => {
    await fc.assert(
      fc.asyncProperty(confessionArbitrary, async (confession) => {
        const metadata = generateOpenGraphMetadata(confession);

        // Property: Metadata should have title with category
        expect(metadata.title).toContain('Anonymous Confession');
        expect(metadata.title).toContain(confession.category);

        // Property: Metadata should have description with confession text
        if (confession.text.length <= 200) {
          expect(metadata.description).toBe(confession.text);
        } else {
          expect(metadata.description).toContain(confession.text.slice(0, 197));
          expect(metadata.description).toMatch(/\.\.\.$/);
        }

        // Property: Metadata should have image URL
        expect(metadata.image).toMatch(/^https?:\/\/.+\/og-image\.png$/);

        // Property: Metadata should have URL with confession ID
        expect(metadata.url).toContain(`confession=${confession.id}`);
      }),
      { numRuns: 100 }
    );
  });

  it('should truncate description at 200 characters when text is longer', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          ...confessionArbitrary.value,
          text: fc.string({ minLength: 201, maxLength: 500 }),
        }),
        async (confession) => {
          const metadata = generateOpenGraphMetadata(confession);

          // Property: Description should be at most 200 characters
          expect(metadata.description.length).toBeLessThanOrEqual(200);

          // Property: Description should end with ellipsis
          expect(metadata.description).toMatch(/\.\.\.$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve full text in description when under 200 characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          ...confessionArbitrary.value,
          text: fc.string({ minLength: 10, maxLength: 200 }),
        }),
        async (confession) => {
          const metadata = generateOpenGraphMetadata(confession);

          // Property: Full text should be preserved
          expect(metadata.description).toBe(confession.text);

          // Property: Should not have ellipsis
          expect(metadata.description).not.toMatch(/\.\.\.$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique URLs for different confessions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(confessionArbitrary, { minLength: 2, maxLength: 10 }),
        async (confessions) => {
          const urls = confessions.map((c) => generateOpenGraphMetadata(c).url);

          // Property: All URLs should be unique
          const uniqueUrls = new Set(urls);
          expect(uniqueUrls.size).toBe(confessions.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
