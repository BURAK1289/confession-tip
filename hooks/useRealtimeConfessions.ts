"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  subscribeToConfessions,
  unsubscribe,
  ConfessionPayload,
} from "@/lib/supabase/realtime";
import { Confession, ConfessionCategory } from "@/types";

interface UseRealtimeConfessionsOptions {
  enabled?: boolean;
  onNewConfession?: (confession: Confession) => void;
  onConfessionUpdated?: (confession: Confession) => void;
}

/**
 * Hook for real-time confession updates
 * Automatically updates React Query cache when new confessions arrive
 */
export function useRealtimeConfessions(
  options: UseRealtimeConfessionsOptions = {}
) {
  const { enabled = true, onNewConfession, onConfessionUpdated } = options;
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof subscribeToConfessions> | null>(
    null
  );

  // Convert payload to Confession type
  const payloadToConfession = useCallback(
    (payload: ConfessionPayload): Confession => ({
      id: payload.id,
      text: payload.content || "",
      category: (payload.category || "random") as ConfessionCategory,
      author_address: payload.author_address || "",
      total_tips: payload.total_tips,
      tip_count: payload.tip_count,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
    }),
    []
  );

  // Handle new confession
  const handleInsert = useCallback(
    (payload: ConfessionPayload) => {
      const confession = payloadToConfession(payload);

      // Update React Query cache - prepend to confessions list
      queryClient.setQueryData<Confession[]>(
        ["confessions"],
        (oldData = []) => {
          // Avoid duplicates
          if (oldData.some((c) => c.id === confession.id)) {
            return oldData;
          }
          return [confession, ...oldData];
        }
      );

      // Also update paginated queries
      queryClient.invalidateQueries({ queryKey: ["confessions"] });

      // Call callback if provided
      onNewConfession?.(confession);
    },
    [queryClient, payloadToConfession, onNewConfession]
  );

  // Handle confession update (e.g., tip count changed)
  const handleUpdate = useCallback(
    (payload: ConfessionPayload) => {
      const confession = payloadToConfession(payload);

      // Update React Query cache
      queryClient.setQueryData<Confession[]>(["confessions"], (oldData = []) =>
        oldData.map((c) => (c.id === confession.id ? confession : c))
      );

      // Update individual confession query
      queryClient.setQueryData(["confession", confession.id], confession);

      // Call callback if provided
      onConfessionUpdated?.(confession);
    },
    [queryClient, payloadToConfession, onConfessionUpdated]
  );

  // Handle confession delete
  const handleDelete = useCallback(
    (payload: ConfessionPayload) => {
      queryClient.setQueryData<Confession[]>(["confessions"], (oldData = []) =>
        oldData.filter((c) => c.id !== payload.id)
      );

      // Remove individual confession query
      queryClient.removeQueries({ queryKey: ["confession", payload.id] });
    },
    [queryClient]
  );

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to confession changes
    channelRef.current = subscribeToConfessions(
      handleInsert,
      handleUpdate,
      handleDelete
    );

    // Check connection status
    const checkConnection = () => {
      if (channelRef.current) {
        setIsConnected(channelRef.current.state === "joined");
      }
    };

    // Initial check
    const timeout = setTimeout(checkConnection, 1000);

    // Periodic check
    const interval = setInterval(checkConnection, 5000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      unsubscribe("confessions-channel");
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, handleInsert, handleUpdate, handleDelete]);

  return { isConnected };
}
