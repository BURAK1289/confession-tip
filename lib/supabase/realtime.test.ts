import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";

/**
 * Property 25: Offline Sync
 * Validates: Requirements 9.5
 *
 * For any queued action during offline mode, when the network is restored,
 * the action should be processed and removed from the queue.
 */

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Types for offline queue
interface QueuedAction {
  id: string;
  type: "create_confession" | "send_tip";
  data: Record<string, unknown>;
  timestamp: number;
}

// Offline queue implementation for testing
class OfflineQueue {
  private queue: QueuedAction[] = [];
  private storageKey = "offline_action_queue";

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorageMock.getItem(this.storageKey);
    if (stored) {
      try {
        this.queue = JSON.parse(stored);
      } catch {
        this.queue = [];
      }
    }
  }

  private saveToStorage(): void {
    localStorageMock.setItem(this.storageKey, JSON.stringify(this.queue));
  }

  addToQueue(
    type: QueuedAction["type"],
    data: Record<string, unknown>
  ): string {
    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
    };
    this.queue.push(action);
    this.saveToStorage();
    return action.id;
  }

  removeFromQueue(id: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter((action) => action.id !== id);
    this.saveToStorage();
    return this.queue.length < initialLength;
  }

  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  async processQueue(
    processor: (action: QueuedAction) => Promise<boolean>
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    const actionsToProcess = [...this.queue];

    for (const action of actionsToProcess) {
      try {
        const success = await processor(action);
        if (success) {
          this.removeFromQueue(action.id);
          processed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { processed, failed };
  }

  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }
}

describe("Property 25: Offline Sync", () => {
  let offlineQueue: OfflineQueue;

  beforeEach(() => {
    localStorageMock.clear();
    offlineQueue = new OfflineQueue();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  /**
   * Feature: confession-tip, Property 25: Offline Sync
   * Validates: Requirements 9.5
   *
   * For any queued action during offline mode, when the network is restored,
   * the action should be processed and removed from the queue.
   */
  it("should process and remove queued actions when network is restored", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random confession data
        fc.record({
          content: fc.string({ minLength: 10, maxLength: 500 }),
          is_anonymous: fc.boolean(),
        }),
        // Generate random tip data
        fc.record({
          confession_id: fc.uuid(),
          amount: fc.float({ min: Math.fround(0.001), max: Math.fround(1), noNaN: true }),
        }),
        async (confessionData, tipData) => {
          // Clear queue before test
          offlineQueue.clear();

          // Add actions to queue (simulating offline mode)
          offlineQueue.addToQueue(
            "create_confession",
            confessionData
          );
          offlineQueue.addToQueue("send_tip", tipData);

          // Verify actions are in queue
          expect(offlineQueue.getQueueLength()).toBe(2);

          // Simulate network restoration and process queue
          const result = await offlineQueue.processQueue(async () => {
            // Simulate successful API call
            return true;
          });

          // Verify all actions were processed
          expect(result.processed).toBe(2);
          expect(result.failed).toBe(0);

          // Verify queue is empty after processing
          expect(offlineQueue.getQueueLength()).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve failed actions in queue for retry", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            content: fc.string({ minLength: 10, maxLength: 100 }),
            shouldFail: fc.boolean(),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (actions) => {
          offlineQueue.clear();

          // Add all actions to queue
          actions.forEach((action, index) =>
            offlineQueue.addToQueue("create_confession", {
              ...action,
              index,
            })
          );

          const initialQueueLength = offlineQueue.getQueueLength();
          expect(initialQueueLength).toBe(actions.length);

          // Process queue with some failures
          let processIndex = 0;
          const result = await offlineQueue.processQueue(async () => {
            const shouldSucceed = !actions[processIndex].shouldFail;
            processIndex++;
            return shouldSucceed;
          });

          // Count expected successes and failures
          const expectedSuccesses = actions.filter((a) => !a.shouldFail).length;
          const expectedFailures = actions.filter((a) => a.shouldFail).length;

          expect(result.processed).toBe(expectedSuccesses);
          expect(result.failed).toBe(expectedFailures);

          // Failed actions should remain in queue
          expect(offlineQueue.getQueueLength()).toBe(expectedFailures);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should persist queue to storage", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom(
              "create_confession",
              "send_tip"
            ) as fc.Arbitrary<"create_confession" | "send_tip">,
            data: fc.record({
              content: fc.string({ minLength: 1, maxLength: 50 }),
            }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (actions) => {
          offlineQueue.clear();

          // Add actions to queue
          for (const action of actions) {
            offlineQueue.addToQueue(action.type, action.data);
          }

          // Verify storage contains the queue
          const stored = localStorageMock.getItem("offline_action_queue");
          expect(stored).not.toBeNull();

          const parsedQueue = JSON.parse(stored!);
          expect(parsedQueue.length).toBe(actions.length);

          // Create new queue instance (simulating page reload)
          const newQueue = new OfflineQueue();

          // Verify queue is restored from storage
          expect(newQueue.getQueueLength()).toBe(actions.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should maintain action order in queue", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.nat({ max: 1000 }), { minLength: 2, maxLength: 10 }),
        async (orderValues) => {
          offlineQueue.clear();

          // Add actions with order values
          for (const orderValue of orderValues) {
            offlineQueue.addToQueue("create_confession", {
              order: orderValue,
            });
          }

          // Get queue and verify order
          const queue = offlineQueue.getQueue();

          // Actions should be in the order they were added
          for (let i = 0; i < queue.length; i++) {
            expect((queue[i].data as { order: number }).order).toBe(
              orderValues[i]
            );
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
