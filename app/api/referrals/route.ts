import { NextRequest, NextResponse } from "next/server";
import {
  getUserByReferralCode,
  getOrCreateUser,
  incrementUserReferrals,
} from "@/lib/db/users";
import { createReferral, getReferralByAddresses } from "@/lib/db/referrals";
import { ValidationError, DatabaseError } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referral_code, referee_address } = body;

    // Validate input
    if (!referral_code || !referee_address) {
      throw new ValidationError(
        "Missing required fields: referral_code, referee_address"
      );
    }

    // Validate referee address format
    if (!referee_address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError("Invalid referee address format");
    }

    // Get referrer by referral code
    const referrer = await getUserByReferralCode(referral_code);
    if (!referrer) {
      throw new ValidationError("Invalid referral code");
    }

    // Prevent self-referral
    if (
      referrer.address.toLowerCase() === referee_address.toLowerCase()
    ) {
      throw new ValidationError("Cannot refer yourself");
    }

    // Check if referral already exists
    const existingReferral = await getReferralByAddresses(
      referrer.address,
      referee_address
    );
    if (existingReferral) {
      return NextResponse.json(
        { error: "Referral already exists" },
        { status: 409 }
      );
    }

    // Ensure referee user exists
    await getOrCreateUser(referee_address);

    // Create referral record
    // Note: In a real implementation, this would initiate USDC transfers
    // using Paymaster for both referrer and referee (0.01 USDC each)
    // For now, we'll create the record without the transaction hash
    const referral = await createReferral(referrer.address, referee_address);

    // Update referrer statistics
    await incrementUserReferrals(referrer.address);

    // In a real implementation, we would:
    // 1. Use OnchainKit Transaction component to initiate USDC transfers
    // 2. Use Paymaster to sponsor gas fees
    // 3. Send notification to referrer
    // 4. Update referral record with transaction hash

    return NextResponse.json(
      {
        referral,
        message: "Referral created successfully",
        // In production, this would include transaction details
        bonus: {
          referrer_bonus: 0.01,
          referee_bonus: 0.01,
          currency: "USDC",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Referral creation error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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
