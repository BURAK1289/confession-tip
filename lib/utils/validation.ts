import { ValidationError } from "@/types";
import type { ConfessionCategory } from "@/types";

const CONFESSION_MIN_LENGTH = 10;
const CONFESSION_MAX_LENGTH = 500;

export function validateConfessionText(text: string): void {
  if (!text || typeof text !== "string") {
    throw new ValidationError("Confession text is required");
  }

  const trimmedText = text.trim();

  if (trimmedText.length < CONFESSION_MIN_LENGTH) {
    throw new ValidationError(
      `Confession must be at least ${CONFESSION_MIN_LENGTH} characters`
    );
  }

  if (trimmedText.length > CONFESSION_MAX_LENGTH) {
    throw new ValidationError(
      `Confession must not exceed ${CONFESSION_MAX_LENGTH} characters`
    );
  }

  // Check if text is only whitespace
  if (trimmedText.length === 0) {
    throw new ValidationError("Confession cannot be empty or only whitespace");
  }
}

export function validateWalletAddress(address: string): void {
  if (!address || typeof address !== "string") {
    throw new ValidationError("Wallet address is required");
  }

  // Basic Ethereum address validation (0x + 40 hex characters)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!addressRegex.test(address)) {
    throw new ValidationError("Invalid wallet address format");
  }
}

export function validateCategory(category: string): asserts category is ConfessionCategory {
  const validCategories: ConfessionCategory[] = [
    "funny",
    "deep",
    "relationship",
    "work",
    "random",
    "wholesome",
    "regret",
  ];

  if (!validCategories.includes(category as ConfessionCategory)) {
    throw new ValidationError(`Invalid category: ${category}`);
  }
}

export function validateTransactionHash(hash: string): void {
  if (!hash || typeof hash !== "string") {
    throw new ValidationError("Transaction hash is required");
  }

  // Basic transaction hash validation (0x + 64 hex characters)
  const hashRegex = /^0x[a-fA-F0-9]{64}$/;
  if (!hashRegex.test(hash)) {
    throw new ValidationError("Invalid transaction hash format");
  }
}

export function validateTipAmount(amount: number): void {
  if (typeof amount !== "number" || isNaN(amount)) {
    throw new ValidationError("Tip amount must be a valid number");
  }

  if (amount <= 0) {
    throw new ValidationError("Tip amount must be greater than 0");
  }

  // Maximum tip amount (e.g., 1000 USDC)
  if (amount > 1000) {
    throw new ValidationError("Tip amount exceeds maximum allowed");
  }
}

export function validateReferralCode(code: string): void {
  if (!code || typeof code !== "string") {
    throw new ValidationError("Referral code is required");
  }

  // Referral code format: REF + 8 uppercase hex characters
  const codeRegex = /^REF[A-F0-9]{8}$/;
  if (!codeRegex.test(code)) {
    throw new ValidationError("Invalid referral code format");
  }
}

export function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}
