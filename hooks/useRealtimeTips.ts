"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  subscribeToTips,
  subscribeToAllTips,
  subscribeToUserTips,
  unsubscribe,
  TipPayload,
} from "@/lib/supabase/realtime";
import { Confession } from "@/types";

interface UseRealtimeTipsOptions {
  confessionId?: string;
  enabled?: boolean;
  onNewTip?: (tip: TipPayload) => void;
}

/**
 * Hook for real-time tip updates on a specific confession
 */
export function useRealtimeTips(options: UseRealtimeTipsOptions = {}) {
  const { confessionId, enabled = true, onNewTip } = options;
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof subscribeToTips> | null>(null);

  const handleNewTip = useCallback(
    (tip: TipPayload) => {
      // Update confession in cache with new tip data
      queryClient.setQueryData<Confession>(
        ["confession", tip.confession_id],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            tip_count: oldData.tip_count + 1,
            total_tips: oldData.total_tips + tip.amount,
          };
        }
      );

      // Update confession in list cache
      queryClient.setQueryData<Confession[]>(["confessions"], (oldData = []) =>
        oldData.map((c) =>
          c.id === tip.confession_id
            ? {
                ...c,
                tip_count: c.tip_count + 1,
                total_tips: c.total_tips + tip.amount,
              }
            : c
        )
      );

      // Invalidate leaderboard
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });

      // Call callback
      onNewTip?.(tip);
    },
    [queryClient, onNewTip]
  );

  useEffect(() => {
    if (!enabled || !confessionId) return;

    const channelName = `tips-${confessionId}`;
    channelRef.current = subscribeToTips(confessionId, handleNewTip);

    const checkConnection = () => {
      if (channelRef.current) {
        setIsConnected(channelRef.current.state === "joined");
      }
    };

    const timeout = setTimeout(checkConnection, 1000);
    const interval = setInterval(checkConnection, 5000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      unsubscribe(channelName);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, confessionId, handleNewTip]);

  return { isConnected };
}

interface UseRealtimeAllTipsOptions {
  enabled?: boolean;
  onNewTip?: (tip: TipPayload) => void;
}

/**
 * Hook for real-time updates on all tips (for leaderboard)
 */
export function useRealtimeAllTips(options: UseRealtimeAllTipsOptions = {}) {
  const { enabled = true, onNewTip } = options;
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof subscribeToAllTips> | null>(null);

  const handleNewTip = useCallback(
    (tip: TipPayload) => {
      // Update confession in list cache
      queryClient.setQueryData<Confession[]>(["confessions"], (oldData = []) =>
        oldData.map((c) =>
          c.id === tip.confession_id
            ? {
                ...c,
                tip_count: c.tip_count + 1,
                total_tips: c.total_tips + tip.amount,
              }
            : c
        )
      );

      // Invalidate leaderboard to refetch
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });

      onNewTip?.(tip);
    },
    [queryClient, onNewTip]
  );

  useEffect(() => {
    if (!enabled) return;

    channelRef.current = subscribeToAllTips(handleNewTip);

    const checkConnection = () => {
      if (channelRef.current) {
        setIsConnected(channelRef.current.state === "joined");
      }
    };

    const timeout = setTimeout(checkConnection, 1000);
    const interval = setInterval(checkConnection, 5000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      unsubscribe("all-tips-channel");
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, handleNewTip]);

  return { isConnected };
}

interface UseRealtimeUserTipsOptions {
  userAddress?: string;
  enabled?: boolean;
  onTipReceived?: (tip: TipPayload) => void;
}

/**
 * Hook for real-time updates on tips received by a user
 */
export function useRealtimeUserTips(options: UseRealtimeUserTipsOptions = {}) {
  const { userAddress, enabled = true, onTipReceived } = options;
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof subscribeToUserTips> | null>(
    null
  );

  const handleTipReceived = useCallback(
    (tip: TipPayload) => {
      // Invalidate profile data
      queryClient.invalidateQueries({ queryKey: ["profile", userAddress] });

      onTipReceived?.(tip);
    },
    [queryClient, userAddress, onTipReceived]
  );

  useEffect(() => {
    if (!enabled || !userAddress) return;

    const channelName = `user-tips-${userAddress}`;
    channelRef.current = subscribeToUserTips(userAddress, handleTipReceived);

    const checkConnection = () => {
      if (channelRef.current) {
        setIsConnected(channelRef.current.state === "joined");
      }
    };

    const timeout = setTimeout(checkConnection, 1000);
    const interval = setInterval(checkConnection, 5000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      unsubscribe(channelName);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, userAddress, handleTipReceived]);

  return { isConnected };
}
