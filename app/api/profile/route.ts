import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db/users";
import { getConfessionsByAuthor } from "@/lib/db/confessions";
import { ValidationError, DatabaseError } from "@/types";

export async function GET(request: NextRequest) {
  try {
    // Get wallet address from query params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    // Validate address
    if (!address) {
      throw new ValidationError("Wallet address is required");
    }

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError("Invalid wallet address format");
    }

    // Get or create user (this will generate referral code if needed)
    const user = await getOrCreateUser(address);

    // Fetch user's confessions with tip amounts
    const confessions = await getConfessionsByAuthor(address);

    // Return user stats and confession list
    return NextResponse.json(
      {
        user: {
          address: user.address,
          total_confessions: user.total_confessions,
          total_tips_received: user.total_tips_received,
          total_tips_given: user.total_tips_given,
          referral_code: user.referral_code,
          referral_count: user.referral_count,
          created_at: user.created_at,
        },
        confessions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile fetch error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
