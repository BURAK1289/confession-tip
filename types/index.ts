// Database Types
export interface Confession {
  id: string;
  text: string;
  category: ConfessionCategory;
  author_address: string;
  total_tips: number;
  tip_count: number;
  created_at: string;
  updated_at: string;
}

export interface Tip {
  id: string;
  confession_id: string;
  tipper_address: string;
  amount: number;
  transaction_hash: string;
  created_at: string;
}

export interface User {
  address: string;
  fid?: number;
  username?: string;
  total_confessions: number;
  total_tips_received: number;
  total_tips_given: number;
  referral_code: string;
  referral_count: number;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_address: string;
  referee_address: string;
  bonus_transaction_hash?: string;
  created_at: string;
}

// Confession Categories (as per requirements 2.4)
export type ConfessionCategory =
  | "funny"
  | "deep"
  | "relationship"
  | "work"
  | "random"
  | "wholesome"
  | "regret";

export const CONFESSION_CATEGORIES: ConfessionCategory[] = [
  "funny",
  "deep",
  "relationship",
  "work",
  "random",
  "wholesome",
  "regret",
];

// API Request/Response Types
export interface CreateConfessionRequest {
  text: string;
  author_address: string;
}

export interface CreateConfessionResponse {
  confession: Confession;
}

export interface GetConfessionsRequest {
  page?: number;
  limit?: number;
  category?: ConfessionCategory;
  sort?: "recent" | "top";
}

export interface GetConfessionsResponse {
  confessions: Confession[];
  hasMore: boolean;
  total: number;
}

export interface CreateTipRequest {
  confession_id: string;
  tipper_address: string;
  transaction_hash: string;
}

export interface CreateTipResponse {
  tip: Tip;
  confession: Confession;
}

export interface GetLeaderboardResponse {
  confessions: (Confession & { rank: number })[];
}

export interface GetProfileResponse {
  user: User;
  confessions: Confession[];
}

export interface CreateReferralRequest {
  referral_code: string;
  referee_address: string;
}

export interface CreateReferralResponse {
  referral: Referral;
  bonus_transaction_hash: string;
}

// AI Types
export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    harassment: boolean;
    self_harm: boolean;
    sexual: boolean;
    violence: boolean;
  };
  reason?: string;
}

export interface CategorizationResult {
  category: ConfessionCategory;
  confidence: number;
}

// Error Types
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ModerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModerationError";
  }
}

// Utility Types
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

// Analytics Event Types
export type AnalyticsEvent =
  | "confession_created"
  | "tip_sent"
  | "confession_shared"
  | "referral_completed";

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  properties: Record<string, unknown>;
  timestamp: string;
}

// Stats Types
export interface PublicStats {
  total_confessions: number;
  total_tips: number;
  total_tip_volume: number;
  total_users: number;
}
