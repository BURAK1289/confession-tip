"use client";

import { useState, useEffect, useCallback } from "react";
import { reconnectAll, getConnectionStatus } from "@/lib/supabase/realtime";

interface NetworkStatus {
  isOnline: boolean;
  isRealtimeConnected: boolean;
  lastOnlineAt: Date | null;
  reconnecting: boolean;
}

/**
 * Hook for monitoring network and realtime connection status
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isRealtimeConnected: false,
    lastOnlineAt: null,
    reconnecting: false,
  });

  // Handle online event
  const handleOnline = useCallback(async () => {
    setStatus((prev) => ({
      ...prev,
      isOnline: true,
      lastOnlineAt: new Date(),
      reconnecting: true,
    }));

    // Attempt to reconnect realtime channels
    try {
      await reconnectAll();
      setStatus((prev) => ({
        ...prev,
        isRealtimeConnected: true,
        reconnecting: false,
      }));
    } catch (error) {
      console.error("Failed to reconnect realtime:", error);
      setStatus((prev) => ({
        ...prev,
        reconnecting: false,
      }));
    }
  }, []);

  // Handle offline event
  const handleOffline = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      isOnline: false,
      isRealtimeConnected: false,
    }));
  }, []);

  // Check realtime connection status periodically
  const checkRealtimeStatus = useCallback(() => {
    const connectionStatus = getConnectionStatus();
    setStatus((prev) => ({
      ...prev,
      isRealtimeConnected: connectionStatus === "joined",
    }));
  }, []);

  useEffect(() => {
    // Set initial online status
    if (typeof navigator !== "undefined") {
      setStatus((prev) => ({
        ...prev,
        isOnline: navigator.onLine,
        lastOnlineAt: navigator.onLine ? new Date() : null,
      }));
    }

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check realtime status periodically
    const interval = setInterval(checkRealtimeStatus, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [handleOnline, handleOffline, checkRealtimeStatus]);

  // Manual reconnect function
  const reconnect = useCallback(async () => {
    if (!status.isOnline) return;

    setStatus((prev) => ({ ...prev, reconnecting: true }));

    try {
      await reconnectAll();
      setStatus((prev) => ({
        ...prev,
        isRealtimeConnected: true,
        reconnecting: false,
      }));
    } catch (error) {
      console.error("Manual reconnect failed:", error);
      setStatus((prev) => ({ ...prev, reconnecting: false }));
    }
  }, [status.isOnline]);

  return {
    ...status,
    reconnect,
  };
}

/**
 * Hook for offline data queue
 * Stores actions to be synced when back online
 */
interface QueuedAction {
  id: string;
  type: "create_confession" | "send_tip";
  data: Record<string, unknown>;
  timestamp: number;
}

const QUEUE_STORAGE_KEY = "offline_action_queue";

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isOnline } = useNetworkStatus();

  // Load queue from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        try {
          setQueue(JSON.parse(stored));
        } catch {
          localStorage.removeItem(QUEUE_STORAGE_KEY);
        }
      }
    }
  }, []);

  // Save queue to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    }
  }, [queue]);

  // Add action to queue
  const addToQueue = useCallback(
    (type: QueuedAction["type"], data: Record<string, unknown>) => {
      const action: QueuedAction = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
      };

      setQueue((prev) => [...prev, action]);
      return action.id;
    },
    []
  );

  // Remove action from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((action) => action.id !== id));
  }, []);

  // Process queue when back online
  const processQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0 || isSyncing) return;

    setIsSyncing(true);

    for (const action of queue) {
      try {
        if (action.type === "create_confession") {
          await fetch("/api/confessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(action.data),
          });
        } else if (action.type === "send_tip") {
          await fetch("/api/tips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(action.data),
          });
        }

        removeFromQueue(action.id);
      } catch (error) {
        console.error(`Failed to process queued action ${action.id}:`, error);
        // Keep in queue for retry
      }
    }

    setIsSyncing(false);
  }, [isOnline, queue, isSyncing, removeFromQueue]);

  // Auto-process queue when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue();
    }
  }, [isOnline, queue.length, processQueue]);

  return {
    queue,
    queueLength: queue.length,
    isSyncing,
    addToQueue,
    removeFromQueue,
    processQueue,
  };
}
