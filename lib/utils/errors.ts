import {
  ValidationError,
  RateLimitError,
  DatabaseError,
  ModerationError,
} from "@/types";

export { ValidationError, RateLimitError, DatabaseError, ModerationError };

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function isModerationError(error: unknown): error is ModerationError {
  return error instanceof ModerationError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

export function getErrorCode(error: unknown): string {
  if (isValidationError(error)) return "VALIDATION_ERROR";
  if (isRateLimitError(error)) return "RATE_LIMIT_ERROR";
  if (isDatabaseError(error)) return "DATABASE_ERROR";
  if (isModerationError(error)) return "MODERATION_ERROR";
  return "UNKNOWN_ERROR";
}
