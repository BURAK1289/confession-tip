import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbi, decodeEventLog } from "viem";
import { base } from "viem/chains";
import { getConfessionById, updateConfessionTips } from "@/lib/db/confessions";
import { createTip, getTipByTransactionHash } from "@/lib/db/tips";
import {
  getOrCreateUser,
  incrementUserTipsGiven,
  incrementUserTipsReceived,
} from "@/lib/db/users";
import { checkRateLimit, RATE_LIMITS } from "@/lib/utils/rateLimit";
import {
  ValidationError,
  RateLimitError,
  DatabaseError,
  type CreateTipRequest,
  type CreateTipResponse,
} from "@/types";

// USDC contract ABI (minimal - just the Transfer event)
const USDC_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

// Create a public client for Base network
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export async function POST(request: NextRequest) {
  try {
    const body: CreateTipRequest = await request.json();
    const { confession_id, tipper_address, transaction_hash } = body;

    // Validate input
    if (!confession_id || !tipper_address || !transaction_hash) {
      throw new ValidationError(
        "Missing required fields: confession_id, tipper_address, transaction_hash"
      );
    }

    // Validate addresses format
    if (
      !tipper_address.match(/^0x[a-fA-F0-9]{40}$/) ||
      !transaction_hash.match(/^0x[a-fA-F0-9]{64}$/)
    ) {
      throw new ValidationError("Invalid address or transaction hash format");
    }

    // Check if tip already exists (prevent duplicate processing)
    const existingTip = await getTipByTransactionHash(transaction_hash);
    if (existingTip) {
      return NextResponse.json(
        { error: "Tip already processed for this transaction" },
        { status: 409 }
      );
    }

    // Check rate limit (50 tips per user per day)
    await checkRateLimit(tipper_address, "tip", RATE_LIMITS.tip);

    // Get confession to verify it exists and get author address
    const confession = await getConfessionById(confession_id);
    if (!confession) {
      throw new ValidationError("Confession not found");
    }

    // Prevent self-tipping (Requirement 4.7)
    if (
      confession.author_address.toLowerCase() === tipper_address.toLowerCase()
    ) {
      throw new ValidationError("Cannot tip your own confession");
    }

    // Verify transaction on Base network
    const transaction = await publicClient.getTransaction({
      hash: transaction_hash as `0x${string}`,
    });

    if (!transaction) {
      throw new ValidationError("Transaction not found on Base network");
    }

    // Verify transaction is confirmed
    const receipt = await publicClient.getTransactionReceipt({
      hash: transaction_hash as `0x${string}`,
    });

    if (!receipt || receipt.status !== "success") {
      throw new ValidationError("Transaction not confirmed or failed");
    }

    // Verify transaction is to USDC contract
    const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
    if (!usdcAddress) {
      throw new Error("USDC address not configured");
    }

    if (transaction.to?.toLowerCase() !== usdcAddress.toLowerCase()) {
      throw new ValidationError("Transaction is not a USDC transfer");
    }

    // Parse transaction logs to extract tip amount and recipient
    const transferLog = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === usdcAddress.toLowerCase() &&
        log.topics[0] ===
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" // Transfer event signature
    );

    if (!transferLog) {
      throw new ValidationError("No USDC transfer found in transaction");
    }

    // Decode the transfer event
    const decodedLog = decodeEventLog({
      abi: USDC_ABI,
      data: transferLog.data,
      topics: transferLog.topics,
    });

    const { from, value } = decodedLog.args as {
      from: string;
      to: string;
      value: bigint;
    };

    // Verify the sender matches the tipper
    if (from.toLowerCase() !== tipper_address.toLowerCase()) {
      throw new ValidationError("Transaction sender does not match tipper address");
    }

    // Convert USDC amount (6 decimals) to decimal
    const tipAmount = Number(value) / 1_000_000;

    // Validate tip amount is reasonable (between 0.001 and 1 USDC)
    if (tipAmount < 0.001 || tipAmount > 1) {
      throw new ValidationError("Tip amount must be between 0.001 and 1 USDC");
    }

    // Ensure users exist in database
    await getOrCreateUser(tipper_address);
    await getOrCreateUser(confession.author_address);

    // Create tip record
    const tip = await createTip(
      confession_id,
      tipper_address,
      tipAmount,
      transaction_hash
    );

    // Update confession stats (total_tips and tip_count)
    const updatedConfession = await updateConfessionTips(
      confession_id,
      tipAmount
    );

    // Update user statistics
    await incrementUserTipsGiven(tipper_address, tipAmount);
    await incrementUserTipsReceived(confession.author_address, tipAmount);

    const response: CreateTipResponse = {
      tip,
      confession: updatedConfession,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Tip creation error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
