"use client";

import { useQuery } from "@tanstack/react-query";

export interface AppStats {
  totalConfessions: number;
  totalTips: number;
  totalTipAmount: number;
  uniqueUsers: number;
  categoryDistribution: Record<string, number>;
  today: {
    confessions: number;
    tips: number;
    tipAmount: number;
  };
  lastUpdated: string;
}

async function fetchStats(): Promise<AppStats> {
  const response = await fetch("/api/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }

  return response.json();
}

/**
 * Hook to fetch and cache app statistics
 */
export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
