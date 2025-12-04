import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ConfessionCategory } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Validation functions
const VALID_CATEGORIES: ConfessionCategory[] = [
  "funny",
  "deep",
  "relationship",
  "work",
  "random",
  "wholesome",
  "regret",
];

export function validateConfessionText(text: string): void {
  if (!text || typeof text !== "string") {
    throw new Error("Confession text is required");
  }
  const trimmed = text.trim();
  if (trimmed.length < 10) {
    throw new Error("Confession must be at least 10 characters");
  }
  if (trimmed.length > 1000) {
    throw new Error("Confession must be less than 1000 characters");
  }
}

export function validateWalletAddress(address: string): void {
  if (!address || typeof address !== "string") {
    throw new Error("Wallet address is required");
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Invalid wallet address format");
  }
}

export function validateCategory(category: string): void {
  if (!VALID_CATEGORIES.includes(category as ConfessionCategory)) {
    throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }
}

// Formatting functions
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

export function formatUSDC(amount: number): string {
  return `$${amount.toFixed(2)} USDC`;
}

// Pagination helper
export function calculatePagination(
  page: number,
  limit: number
): { offset: number; limit: number } {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  return {
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
  };
}
