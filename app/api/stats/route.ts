import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/stats
 * Returns public aggregate statistics
 * Requirements: 14.4
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient();

    // Get total confessions count
    const { count: totalConfessions, error: confessionsError } = await supabase
      .from("confessions")
      .select("*", { count: "exact", head: true });

    if (confessionsError) {
      throw confessionsError;
    }

    // Get total tips count and sum
    const { data: tipsData, error: tipsError } = await supabase
      .from("tips")
      .select("amount");

    if (tipsError) {
      throw tipsError;
    }

    const totalTips = tipsData?.length || 0;
    const totalTipAmount = tipsData?.reduce((sum, tip) => sum + (tip.amount || 0), 0) || 0;

    // Get unique users count (from confessions and tips)
    const { data: confessionAuthors, error: authorsError } = await supabase
      .from("confessions")
      .select("author_address")
      .not("author_address", "is", null);

    if (authorsError) {
      throw authorsError;
    }

    const { data: tippers, error: tippersError } = await supabase
      .from("tips")
      .select("tipper_address");

    if (tippersError) {
      throw tippersError;
    }

    // Combine unique addresses
    const uniqueAddresses = new Set([
      ...(confessionAuthors?.map((c) => c.author_address) || []),
      ...(tippers?.map((t) => t.tipper_address) || []),
    ]);

    // Get category distribution
    const { data: categoryData, error: categoryError } = await supabase
      .from("confessions")
      .select("category");

    if (categoryError) {
      throw categoryError;
    }

    const categoryDistribution: Record<string, number> = {};
    categoryData?.forEach((c) => {
      const cat = c.category || "uncategorized";
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    });

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayConfessions, error: todayConfError } = await supabase
      .from("confessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    if (todayConfError) {
      throw todayConfError;
    }

    const { data: todayTipsData, error: todayTipsError } = await supabase
      .from("tips")
      .select("amount")
      .gte("created_at", today.toISOString());

    if (todayTipsError) {
      throw todayTipsError;
    }

    const todayTips = todayTipsData?.length || 0;
    const todayTipAmount = todayTipsData?.reduce((sum, tip) => sum + (tip.amount || 0), 0) || 0;

    // Build response
    const stats = {
      totalConfessions: totalConfessions || 0,
      totalTips,
      totalTipAmount,
      uniqueUsers: uniqueAddresses.size,
      categoryDistribution,
      today: {
        confessions: todayConfessions || 0,
        tips: todayTips,
        tipAmount: todayTipAmount,
      },
      lastUpdated: new Date().toISOString(),
    };

    // Add cache headers (5 minutes)
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
