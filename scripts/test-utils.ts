import {
  validateConfessionText,
  validateWalletAddress,
  validateCategory,
  truncateAddress,
  formatRelativeTime,
  formatUSDC,
  calculatePagination,
} from "@/lib/utils";

console.log("Testing utility functions...\n");

// Test validation
try {
  validateConfessionText("This is a valid confession text that is long enough");
  console.log("✅ Valid confession text passed");
} catch (error) {
  console.log("❌ Valid confession text failed:", error);
}

try {
  validateConfessionText("short");
  console.log("❌ Short text should have failed");
} catch (error) {
  console.log("✅ Short text validation works");
}

try {
  validateWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
  console.log("❌ Invalid address should have failed");
} catch (error) {
  console.log("✅ Address validation works");
}

try {
  validateWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
  console.log("✅ Valid address passed");
} catch (error) {
  console.log("❌ Valid address failed:", error);
}

try {
  validateCategory("love");
  console.log("✅ Valid category passed");
} catch (error) {
  console.log("❌ Valid category failed:", error);
}

try {
  validateCategory("invalid");
  console.log("❌ Invalid category should have failed");
} catch (error) {
  console.log("✅ Category validation works");
}

// Test formatting
console.log("\n--- Formatting Tests ---");
console.log("Truncated address:", truncateAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"));
console.log("Relative time (1 hour ago):", formatRelativeTime(new Date(Date.now() - 3600000).toISOString()));
console.log("USDC format:", formatUSDC(1.5));

// Test pagination
console.log("\n--- Pagination Tests ---");
const pagination = calculatePagination(2, 20);
console.log("Page 2, limit 20:", pagination);

console.log("\n✅ All utility tests completed!");
