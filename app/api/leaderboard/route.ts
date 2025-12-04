import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/db/confessions";
import { DatabaseError } from "@/types";

// Cache configuration
const CACHE_TTL = 5 * 60; // 5 minutes in seconds

export async function GET(_request: NextRequest) {
  try {
    // Fetch top 50 confessions sorted by total_tips DESC, tip_count DESC
    const confessions = await getLeaderboard(50);

    // Add rank numbers to each confession
    const leaderboard = confessions.map((confession, index) => ({
      ...confession,
      rank: index + 1,
    }));

    // Return with cache headers (5 minute TTL)
    return NextResponse.json(
      { leaderboard },
      {
        status: 200,
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
        },
      }
    );
  } catch (error) {
    console.error("Leaderboard fetch error:", error);

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: "Failed to fetch leaderboard" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
