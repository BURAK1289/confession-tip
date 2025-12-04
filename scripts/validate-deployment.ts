/**
 * Pre-Deployment Validation Script
 *
 * Validates that all required configuration is in place before deployment.
 *
 * Usage:
 *   npx tsx scripts/validate-deployment.ts
 */

import "dotenv/config";

interface ValidationResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

const results: ValidationResult[] = [];

function check(
  name: string,
  condition: boolean,
  passMessage: string,
  failMessage: string,
  isWarning = false
) {
  results.push({
    name,
    status: condition ? "pass" : isWarning ? "warn" : "fail",
    message: condition ? passMessage : failMessage,
  });
}

async function checkMinikitConfig() {
  try {
    const configModule = await import("../minikit.config");
    const minikitConfig = configModule.minikitConfig;

    check(
      "App Name",
      minikitConfig.miniapp?.name?.length > 0,
      `"${minikitConfig.miniapp?.name}"`,
      "App name not set"
    );

    check(
      "App Version",
      minikitConfig.miniapp?.version === "1",
      "Version 1",
      "Version should be '1'"
    );

    check(
      "Primary Category",
      minikitConfig.miniapp?.primaryCategory === "social",
      "Category: social",
      "Category not set to 'social'"
    );

    check(
      "Account Association Header",
      !!minikitConfig.accountAssociation?.header,
      "Header set",
      "Header not set - generate at https://base.org/build",
      true
    );

    check(
      "Account Association Payload",
      !!minikitConfig.accountAssociation?.payload,
      "Payload set",
      "Payload not set - generate at https://base.org/build",
      true
    );

    check(
      "Account Association Signature",
      !!minikitConfig.accountAssociation?.signature,
      "Signature set",
      "Signature not set - generate at https://base.org/build",
      true
    );

    check(
      "Base Builder Allowed Addresses",
      !!(minikitConfig.baseBuilder?.allowedAddresses?.length),
      `Addresses: ${minikitConfig.baseBuilder?.allowedAddresses?.[0]?.slice(0, 10)}...`,
      "Allowed addresses not set - required for Base rewards",
      true
    );

    check(
      "Tags Count",
      (minikitConfig.miniapp?.tags?.length || 0) <= 5,
      `${minikitConfig.miniapp?.tags?.length || 0} tags (max 5)`,
      "Too many tags - max 5 allowed"
    );
  } catch {
    results.push({
      name: "minikit.config.ts",
      status: "fail",
      message: "Could not load config file",
    });
  }
}

function printResults() {
  console.log("\n" + "=".repeat(60) + "\n");
  console.log("📊 VALIDATION RESULTS\n");

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  for (const result of results) {
    const icon =
      result.status === "pass" ? "✅" : result.status === "warn" ? "⚠️" : "❌";
    console.log(`${icon} ${result.name}: ${result.message}`);

    if (result.status === "pass") passCount++;
    else if (result.status === "warn") warnCount++;
    else failCount++;
  }

  console.log("\n" + "=".repeat(60) + "\n");
  console.log(
    `Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed\n`
  );

  if (failCount > 0) {
    console.log(
      "❌ Deployment validation FAILED. Please fix the issues above.\n"
    );
    process.exit(1);
  } else if (warnCount > 0) {
    console.log("⚠️  Deployment validation PASSED with warnings.\n");
    console.log("   Some optional configurations are missing.");
    console.log("   You can deploy, but consider addressing the warnings.\n");
    process.exit(0);
  } else {
    console.log("✅ Deployment validation PASSED. Ready to deploy!\n");
    process.exit(0);
  }
}

async function main() {
  console.log("\n🔍 Validating deployment configuration...\n");

  // Environment Variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_ONCHAINKIT_API_KEY",
    "NEXT_PUBLIC_CDP_PROJECT_ID",
    "OPENAI_API_KEY",
  ];

  const optionalEnvVars = [
    "NEXT_PUBLIC_URL",
    "SENTRY_DSN",
    "NEXT_PUBLIC_POSTHOG_KEY",
  ];

  console.log("📋 Checking environment variables...\n");

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    check(
      envVar,
      !!value && value.length > 0,
      `Set (${value?.slice(0, 10)}...)`,
      "Missing - REQUIRED"
    );
  }

  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar];
    check(
      envVar,
      !!value && value.length > 0,
      `Set (${value?.slice(0, 10)}...)`,
      "Not set - optional",
      true
    );
  }

  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    check(
      "Supabase URL Format",
      supabaseUrl.includes(".supabase.co"),
      "Valid Supabase URL",
      "Invalid Supabase URL format"
    );
  }

  // Validate Chain ID
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  check(
    "Chain ID (Base Mainnet)",
    chainId === "8453",
    "Configured for Base Mainnet (8453)",
    `Chain ID is ${chainId || "not set"} - should be 8453 for production`
  );

  // Validate USDC Address
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
  check(
    "USDC Contract Address",
    usdcAddress === "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "Correct Base USDC address",
    "USDC address may be incorrect"
  );

  // Check minikit.config.ts
  console.log("\n📋 Checking minikit.config.ts...\n");
  await checkMinikitConfig();

  // Print results
  printResults();
}

main().catch((error) => {
  console.error("Validation failed:", error);
  process.exit(1);
});
