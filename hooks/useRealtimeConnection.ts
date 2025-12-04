"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

/**
 * Hook to monitor Supabase Realtime connection status
 * Handles reconnection after network interruption
 */
export function useRealtimeConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = getSupabase();
    
    // Listen to connection state changes
    const subscription = supabase
      .channel("connection-monitor")
      .on("system", { event: "*" }, (payload) => {
        if (payload.type === "connected") {
          setStatus("connected");
          // Refetch all queries after reconnection
          queryClient.invalidateQueries();
        } else if (payload.type === "disconnected") {
          setStatus("disconnected");
        } else if (payload.type === "reconnecting") {
          setStatus("reconnecting");
        }
      })
      .subscribe();

    // Handle browser online/offline events
    const handleOnline = () => {
      setStatus("reconnecting");
      // Trigger reconnection
      queryClient.invalidateQueries();
    };

    const handleOffline = () => {
      setStatus("disconnected");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      getSupabase().removeChannel(subscription);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  return { status, isConnected: status === "connected" };
}
