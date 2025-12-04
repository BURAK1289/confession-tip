/**
 * Error Logging Utility
 * Requirements: 13.4, 13.5
 */

import { analytics } from "./analytics";

export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  type: "client" | "api" | "network" | "transaction";
}

// In-memory error store (for development/testing)
const errorLogs: ErrorLog[] = [];
const MAX_LOGS = 100;

/**
 * Log an error with context
 */
export function logError(
  error: Error,
  options: {
    context?: Record<string, unknown>;
    severity?: ErrorLog["severity"];
    type?: ErrorLog["type"];
  } = {}
): string {
  const {
    context = {},
    severity = "medium",
    type = "client",
  } = options;

  const errorLog: ErrorLog = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    severity,
    type,
  };

  // Add to in-memory store
  errorLogs.unshift(errorLog);
  if (errorLogs.length > MAX_LOGS) {
    errorLogs.pop();
  }

  // Track in analytics
  analytics.trackError(error, {
    ...context,
    severity,
    type,
    errorId: errorLog.id,
  });

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error(`[${severity.toUpperCase()}] ${type}:`, error.message, context);
  }

  // In production, send to monitoring service (Sentry, etc.)
  if (process.env.NODE_ENV === "production") {
    sendToMonitoringService(errorLog);
  }

  return errorLog.id;
}

/**
 * Log an API error
 */
export function logApiError(
  endpoint: string,
  statusCode: number,
  message: string,
  context?: Record<string, unknown>
): string {
  const error = new Error(`API Error: ${message}`);
  
  return logError(error, {
    context: {
      endpoint,
      statusCode,
      ...context,
    },
    severity: statusCode >= 500 ? "high" : "medium",
    type: "api",
  });
}

/**
 * Log a network error
 */
export function logNetworkError(
  url: string,
  message: string,
  context?: Record<string, unknown>
): string {
  const error = new Error(`Network Error: ${message}`);
  
  return logError(error, {
    context: {
      url,
      ...context,
    },
    severity: "medium",
    type: "network",
  });
}

/**
 * Log a transaction error
 */
export function logTransactionError(
  transactionHash: string | undefined,
  message: string,
  context?: Record<string, unknown>
): string {
  const error = new Error(`Transaction Error: ${message}`);
  
  return logError(error, {
    context: {
      transactionHash,
      ...context,
    },
    severity: "high",
    type: "transaction",
  });
}

/**
 * Get recent error logs (for debugging)
 */
export function getRecentErrors(count: number = 10): ErrorLog[] {
  return errorLogs.slice(0, count);
}

/**
 * Get errors by type
 */
export function getErrorsByType(type: ErrorLog["type"]): ErrorLog[] {
  return errorLogs.filter((log) => log.type === type);
}

/**
 * Clear error logs (for testing)
 */
export function clearErrorLogs(): void {
  errorLogs.length = 0;
}

/**
 * Send error to monitoring service
 * In production, this would integrate with Sentry, LogRocket, etc.
 */
function sendToMonitoringService(errorLog: ErrorLog): void {
  // Placeholder for production monitoring integration
  // Example: Sentry.captureException(new Error(errorLog.message), { extra: errorLog.context });
  
  // For now, just log to console
  if (typeof window !== "undefined") {
    console.log("[Monitoring]", errorLog);
  }
}

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: "Unable to connect. Please check your internet connection.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
  
  // API errors
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",
  NOT_FOUND: "The requested resource was not found.",
  UNAUTHORIZED: "Please connect your wallet to continue.",
  FORBIDDEN: "You don't have permission to perform this action.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  
  // Transaction errors
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  INSUFFICIENT_FUNDS: "Insufficient funds for this transaction.",
  USER_REJECTED: "Transaction was cancelled.",
  
  // Moderation errors
  CONTENT_FLAGGED: "Your content was flagged by our moderation system.",
  
  // Generic
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
};

/**
 * Get user-friendly error message from error
 */
export function getUserFriendlyMessage(error: Error | string): string {
  const message = typeof error === "string" ? error : error.message;
  
  // Check for known error patterns
  if (message.includes("network") || message.includes("fetch")) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  if (message.includes("timeout")) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }
  if (message.includes("rate limit") || message.includes("429")) {
    return ERROR_MESSAGES.RATE_LIMITED;
  }
  if (message.includes("insufficient") || message.includes("balance")) {
    return ERROR_MESSAGES.INSUFFICIENT_FUNDS;
  }
  if (message.includes("rejected") || message.includes("cancelled")) {
    return ERROR_MESSAGES.USER_REJECTED;
  }
  if (message.includes("moderation") || message.includes("flagged")) {
    return ERROR_MESSAGES.CONTENT_FLAGGED;
  }
  
  // Return original message if it's user-friendly, otherwise generic
  if (message.length < 100 && !message.includes("Error:")) {
    return message;
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
