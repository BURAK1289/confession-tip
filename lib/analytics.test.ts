import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { analytics, trackShare, trackConfessionCreated, trackTipSent } from './analytics';
import type { ConfessionCategory } from '@/types';

// Feature: confession-tip, Property 23: Share Event Tracking
describe('Property 23: Share Event Tracking', () => {
  beforeEach(() => {
    // Clear events before each test
    analytics.clearEvents();
  });

  const categoryArbitrary = fc.constantFrom<ConfessionCategory>(
    'funny',
    'deep',
    'relationship',
    'work',
    'random',
    'wholesome',
    'regret'
  );

  it('should log analytics event with confession ID and timestamp for any share action', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        categoryArbitrary,
        fc.string({ minLength: 42, maxLength: 42 }).map((s) => '0x' + s.slice(2)),
        async (confessionId, category, userId) => {
          // Clear before each property test iteration
          analytics.clearEvents();
          
          const timestamp = new Date().toISOString();

          // Track share event
          trackShare({
            confessionId,
            category,
            timestamp,
            userId,
          });

          // Get tracked events
          const events = analytics.getEvents();

          // Property: Exactly one event should be logged
          expect(events.length).toBe(1);

          // Property: The event should be a share event
          const shareEvent = events[0];
          expect(shareEvent.event).toBe('confession_shared');

          // Property: Event should contain confession ID
          expect(shareEvent.properties.confession_id).toBe(confessionId);

          // Property: Event should contain category
          expect(shareEvent.properties.category).toBe(category);

          // Property: Event should contain user ID (may be null if not set)
          // User ID is optional, so we just check it exists in properties
          expect(shareEvent.properties).toHaveProperty('user_id');

          // Property: Event should have a timestamp
          expect(shareEvent.timestamp).toBeDefined();
          expect(new Date(shareEvent.timestamp).getTime()).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track multiple share events independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            confessionId: fc.uuid(),
            category: categoryArbitrary,
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (shareEvents) => {
          // Clear before each property test iteration
          analytics.clearEvents();
          
          // Track all share events with current timestamp
          shareEvents.forEach((event) =>
            trackShare({
              ...event,
              timestamp: new Date().toISOString(),
            })
          );

          // Get tracked events
          const events = analytics.getEvents();

          // Property: Number of tracked events should match number of shares
          const shareEventCount = events.filter((e) => e.event === 'confession_shared').length;
          expect(shareEventCount).toBe(shareEvents.length);

          // Property: All events should be share events
          expect(events.every((e) => e.event === 'confession_shared')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve event order for sequential shares', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 3, maxLength: 5 }),
        categoryArbitrary,
        async (confessionIds, category) => {
          // Clear before each property test iteration
          analytics.clearEvents();
          
          // Track shares in order
          for (const id of confessionIds) {
            trackShare({
              confessionId: id,
              category,
              timestamp: new Date().toISOString(),
            });
          }

          // Get tracked events
          const events = analytics.getEvents();
          const shareEvents = events.filter((e) => e.event === 'confession_shared');

          // Property: Events should be in the same order as tracked
          const trackedIds = shareEvents.map((e) => e.properties.confession_id);
          expect(trackedIds).toEqual(confessionIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include all required properties in share events', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        categoryArbitrary,
        async (confessionId, category) => {
          // Clear before each property test iteration
          analytics.clearEvents();
          
          trackShare({
            confessionId,
            category,
            timestamp: new Date().toISOString(),
          });

          const events = analytics.getEvents();
          const shareEvent = events[0];

          // Property: Event should have all required fields
          expect(shareEvent).toHaveProperty('event');
          expect(shareEvent).toHaveProperty('properties');
          expect(shareEvent).toHaveProperty('timestamp');

          // Property: Properties should have required fields
          expect(shareEvent.properties).toHaveProperty('confession_id');
          expect(shareEvent.properties).toHaveProperty('category');
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 32: Analytics Event Tracking
 * Validates: Requirements 14.1, 14.2, 14.3
 *
 * For any tracked event (confession_created, tip_sent, confession_shared),
 * the event should be logged with all required properties.
 */
describe('Property 32: Analytics Event Tracking', () => {
  beforeEach(() => {
    analytics.clearEvents();
  });

  const categoryArbitrary = fc.constantFrom<ConfessionCategory>(
    'funny',
    'deep',
    'relationship',
    'work',
    'random',
    'wholesome',
    'regret'
  );

  /**
   * Feature: confession-tip, Property 32: Analytics Event Tracking
   * Validates: Requirements 14.1
   *
   * For any confession creation, the event should be logged with confession ID,
   * category, text length, and anonymity status.
   */
  it('should track confession_created events with all required properties', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        categoryArbitrary,
        fc.integer({ min: 10, max: 500 }),
        fc.boolean(),
        async (confessionId, category, textLength, isAnonymous) => {
          analytics.clearEvents();

          trackConfessionCreated({
            confessionId,
            category,
            textLength,
            isAnonymous,
          });

          const events = analytics.getEvents();
          expect(events.length).toBeGreaterThanOrEqual(1);

          const confessionEvent = events.find((e) => e.event === 'confession_created');
          expect(confessionEvent).toBeDefined();
          expect(confessionEvent?.properties.confession_id).toBe(confessionId);
          expect(confessionEvent?.properties.category).toBe(category);
          expect(confessionEvent?.properties.text_length).toBe(textLength);
          expect(confessionEvent?.properties.is_anonymous).toBe(isAnonymous);
          expect(confessionEvent?.timestamp).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 32: Analytics Event Tracking
   * Validates: Requirements 14.2
   *
   * For any tip sent, the event should be logged with confession ID,
   * amount, and currency.
   */
  it('should track tip_sent events with all required properties', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.float({ min: Math.fround(0.001), max: Math.fround(100), noNaN: true }),
        fc.constantFrom('USDC', 'ETH'),
        async (confessionId, amount, currency) => {
          analytics.clearEvents();

          trackTipSent({
            confessionId,
            amount,
            currency,
          });

          const events = analytics.getEvents();
          expect(events.length).toBeGreaterThanOrEqual(1);

          const tipEvent = events.find((e) => e.event === 'tip_sent');
          expect(tipEvent).toBeDefined();
          expect(tipEvent?.properties.confession_id).toBe(confessionId);
          expect(tipEvent?.properties.amount).toBe(amount);
          expect(tipEvent?.properties.currency).toBe(currency);
          expect(tipEvent?.timestamp).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 32: Analytics Event Tracking
   * Validates: Requirements 14.3
   *
   * All events should include session information.
   */
  it('should include session information in all events', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        categoryArbitrary,
        async (confessionId, category) => {
          analytics.clearEvents();

          // Track multiple event types
          trackConfessionCreated({
            confessionId,
            category,
            textLength: 100,
            isAnonymous: true,
          });

          trackShare({
            confessionId,
            category,
            timestamp: new Date().toISOString(),
          });

          trackTipSent({
            confessionId,
            amount: 1.0,
            currency: 'USDC',
          });

          const events = analytics.getEvents();

          // All events should have session_id
          for (const event of events) {
            expect(event.properties.session_id).toBeDefined();
            expect(typeof event.properties.session_id).toBe('string');
          }

          // All events should have the same session_id
          const sessionIds = events.map((e) => e.properties.session_id);
          const uniqueSessionIds = new Set(sessionIds);
          expect(uniqueSessionIds.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: confession-tip, Property 32: Analytics Event Tracking
   * Validates: Requirements 14.1, 14.2, 14.3
   *
   * Events should be retrievable by type.
   */
  it('should allow filtering events by type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        async (confessionCount, shareCount, tipCount) => {
          analytics.clearEvents();

          // Track confession events
          for (let i = 0; i < confessionCount; i++) {
            trackConfessionCreated({
              confessionId: `confession-${i}`,
              category: 'funny',
              textLength: 100,
              isAnonymous: true,
            });
          }

          // Track share events
          for (let i = 0; i < shareCount; i++) {
            trackShare({
              confessionId: `share-${i}`,
              category: 'deep',
              timestamp: new Date().toISOString(),
            });
          }

          // Track tip events
          for (let i = 0; i < tipCount; i++) {
            trackTipSent({
              confessionId: `tip-${i}`,
              amount: 1.0,
              currency: 'USDC',
            });
          }

          // Verify counts by type
          const confessionEvents = analytics.getEventsByType('confession_created');
          const shareEvents = analytics.getEventsByType('confession_shared');
          const tipEvents = analytics.getEventsByType('tip_sent');

          expect(confessionEvents.length).toBe(confessionCount);
          expect(shareEvents.length).toBe(shareCount);
          expect(tipEvents.length).toBe(tipCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
