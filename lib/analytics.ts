/**
 * Analytics tracking utilities
 * Tracks confession, tip, and share events
 * Requirements: 14.1, 14.2, 14.3
 */

export interface ShareEvent {
  confessionId: string;
  category: string;
  timestamp: string;
  userId?: string;
}

export interface ConfessionEvent {
  confessionId: string;
  category: string;
  textLength: number;
  isAnonymous: boolean;
  userId?: string;
}

export interface TipEvent {
  confessionId: string;
  amount: number;
  currency: string;
  tipperId?: string;
  recipientId?: string;
}

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

// Event types for type safety
export type EventType =
  | "confession_created"
  | "confession_viewed"
  | "confession_shared"
  | "tip_sent"
  | "tip_received"
  | "wallet_connected"
  | "wallet_disconnected"
  | "page_view"
  | "error_occurred";

class Analytics {
  private events: AnalyticsEvent[] = [];
  private userId: string | null = null;
  private sessionId: string;
  private sessionStartTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set the current user ID
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Track a confession creation event
   * Requirements: 14.1
   */
  trackConfessionCreated(event: ConfessionEvent): void {
    this.track("confession_created", {
      confession_id: event.confessionId,
      category: event.category,
      text_length: event.textLength,
      is_anonymous: event.isAnonymous,
      user_id: event.userId || this.userId,
    });
  }

  /**
   * Track a confession view event
   */
  trackConfessionViewed(confessionId: string, category: string): void {
    this.track("confession_viewed", {
      confession_id: confessionId,
      category,
    });
  }

  /**
   * Track a share event
   * Requirements: 14.2
   */
  trackShare(event: ShareEvent): void {
    this.track("confession_shared", {
      confession_id: event.confessionId,
      category: event.category,
      user_id: event.userId || this.userId,
    });
  }

  /**
   * Track a tip sent event
   * Requirements: 14.2
   */
  trackTipSent(event: TipEvent): void {
    this.track("tip_sent", {
      confession_id: event.confessionId,
      amount: event.amount,
      currency: event.currency,
      tipper_id: event.tipperId || this.userId,
      recipient_id: event.recipientId,
    });
  }

  /**
   * Track a tip received event
   */
  trackTipReceived(event: TipEvent): void {
    this.track("tip_received", {
      confession_id: event.confessionId,
      amount: event.amount,
      currency: event.currency,
      tipper_id: event.tipperId,
      recipient_id: event.recipientId || this.userId,
    });
  }

  /**
   * Track wallet connection
   */
  trackWalletConnected(address: string): void {
    this.track("wallet_connected", {
      wallet_address: address.slice(0, 10) + "...", // Truncate for privacy
    });
  }

  /**
   * Track wallet disconnection
   */
  trackWalletDisconnected(): void {
    this.track("wallet_disconnected", {});
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string, path: string): void {
    this.track("page_view", {
      page_name: pageName,
      path,
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    this.track("error_occurred", {
      error_message: error.message,
      error_name: error.name,
      ...context,
    });
  }

  /**
   * Track a generic event
   */
  track(eventName: string, properties: Record<string, unknown> = {}): void {
    const event: AnalyticsEvent = {
      event: eventName,
      properties: {
        ...properties,
        session_id: this.sessionId,
        user_id: this.userId,
        session_duration_ms: Date.now() - this.sessionStartTime,
      },
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    // In production, send to analytics service
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      this.sendToAnalyticsService(event);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("📊 Analytics Event:", event);
    }
  }

  /**
   * Send event to analytics service (PostHog, Mixpanel, etc.)
   */
  private sendToAnalyticsService(event: AnalyticsEvent): void {
    // PostHog integration
    if (typeof window !== "undefined" && (window as unknown as { posthog?: { capture: (name: string, props: Record<string, unknown>) => void } }).posthog) {
      (window as unknown as { posthog: { capture: (name: string, props: Record<string, unknown>) => void } }).posthog.capture(event.event, event.properties);
    }
  }

  /**
   * Get all tracked events (for testing)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): AnalyticsEvent[] {
    return this.events.filter((e) => e.event === eventType);
  }

  /**
   * Clear all events (for testing)
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Get session info
   */
  getSessionInfo(): { sessionId: string; duration: number; eventCount: number } {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStartTime,
      eventCount: this.events.length,
    };
  }
}

// Singleton instance
export const analytics = new Analytics();

// Export convenience functions
export const trackShare = (event: ShareEvent) => analytics.trackShare(event);
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) =>
  analytics.track(eventName, properties);
export const trackConfessionCreated = (event: ConfessionEvent) =>
  analytics.trackConfessionCreated(event);
export const trackTipSent = (event: TipEvent) => analytics.trackTipSent(event);
