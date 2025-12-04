import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Metrics endpoint for monitoring and Base reward program
 * Returns detailed platform metrics
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total counts
    const [
      { count: totalConfessions },
      { count: totalTips },
      { count: totalUsers },
    ] = await Promise.all([
      supabase
        .from("confessions")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase.from("tips").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }),
    ]);

    // 24h metrics
    const [
      { count: confessions24h },
      { count: tips24h },
      { data: tipVolume24h },
    ] = await Promise.all([
      supabase
        .from("confessions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneDayAgo.toISOString())
        .is("deleted_at", null),
      supabase
        .from("tips")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneDayAgo.toISOString()),
      supabase
        .from("tips")
        .select("amount")
        .gte("created_at", oneDayAgo.toISOString()),
    ]);

    // 7d metrics
    const [
      { count: confessions7d },
      { count: tips7d },
      { data: tipVolume7d },
    ] = await Promise.all([
      supabase
        .from("confessions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString())
        .is("deleted_at", null),
      supabase
        .from("tips")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString()),
      supabase
        .from("tips")
        .select("amount")
        .gte("created_at", sevenDaysAgo.toISOString()),
    ]);

    // 30d metrics
    const [
      { count: confessions30d },
      { count: tips30d },
      { data: tipVolume30d },
      { count: newUsers30d },
    ] = await Promise.all([
      supabase
        .from("confessions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString())
        .is("deleted_at", null),
      supabase
        .from("tips")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("tips")
        .select("amount")
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString()),
    ]);

    // Calculate volumes
    const volume24h = tipVolume24h?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const volume7d = tipVolume7d?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const volume30d = tipVolume30d?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    // Top categories (last 7 days)
    const { data: categoryData } = await supabase
      .from("confessions")
      .select("category")
      .gte("created_at", sevenDaysAgo.toISOString())
      .is("deleted_at", null);

    const categoryCounts: Record<string, number> = {};
    categoryData?.forEach((c) => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    // Average tip amount
    const avgTipAmount = tips24h && tips24h > 0 ? volume24h / tips24h : 0;

    const metrics = {
      timestamp: now.toISOString(),
      totals: {
        confessions: totalConfessions || 0,
        tips: totalTips || 0,
        users: totalUsers || 0,
      },
      last24h: {
        confessions: confessions24h || 0,
        tips: tips24h || 0,
        volume: volume24h.toFixed(6),
        avgTipAmount: avgTipAmount.toFixed(6),
      },
      last7d: {
        confessions: confessions7d || 0,
        tips: tips7d || 0,
        volume: volume7d.toFixed(6),
      },
      last30d: {
        confessions: confessions30d || 0,
        tips: tips30d || 0,
        volume: volume30d.toFixed(6),
        newUsers: newUsers30d || 0,
      },
      topCategories,
      health: {
        database: "connected",
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "development",
        environment: process.env.NODE_ENV,
      },
    };

    return NextResponse.json(metrics, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
