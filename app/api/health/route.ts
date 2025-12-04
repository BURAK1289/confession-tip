import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Health check endpoint for uptime monitoring
 * Returns status of all critical services
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: "ok" | "error"; latency?: number; error?: string }> = {};

  // Check Supabase connection
  try {
    const supabaseStart = Date.now();
    const supabase = await createClient();
    const { error } = await supabase.from("confessions").select("id").limit(1);
    
    if (error) throw error;
    
    checks.database = {
      status: "ok",
      latency: Date.now() - supabaseStart,
    };
  } catch (error) {
    checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Database connection failed",
    };
  }

  // Check environment variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_ONCHAINKIT_API_KEY",
  ];

  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  
  checks.environment = {
    status: missingEnvVars.length === 0 ? "ok" : "error",
    ...(missingEnvVars.length > 0 && { error: `Missing: ${missingEnvVars.join(", ")}` }),
  };

  // Overall status
  const allOk = Object.values(checks).every((check) => check.status === "ok");
  const totalLatency = Date.now() - startTime;

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "development",
      environment: process.env.NODE_ENV,
      latency: totalLatency,
      checks,
    },
    {
      status: allOk ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
