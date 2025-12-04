import { getSupabase } from "./client";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

// Helper to get supabase instance
const getClient = () => getSupabase();

// Types for realtime events
export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

export interface ConfessionPayload {
  id: string;
  content: string;
  category: string | null;
  is_anonymous: boolean;
  author_address: string | null;
  total_tips: number;
  tip_count: number;
  created_at: string;
  updated_at: string;
}

export interface TipPayload {
  id: string;
  confession_id: string;
  tipper_address: string;
  amount: number;
  transaction_hash: string;
  created_at: string;
}

// Channel management
const channels: Map<string, RealtimeChannel> = new Map();

/**
 * Subscribe to confession changes (INSERT, UPDATE, DELETE)
 */
export function subscribeToConfessions(
  onInsert?: (confession: ConfessionPayload) => void,
  onUpdate?: (confession: ConfessionPayload) => void,
  onDelete?: (confession: ConfessionPayload) => void
): RealtimeChannel {
  const channelName = "confessions-channel";

  // Reuse existing channel if available
  if (channels.has(channelName)) {
    return channels.get(channelName)!;
  }

  const channel = getClient()
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "confessions",
      },
      (payload: RealtimePostgresChangesPayload<ConfessionPayload>) => {
        if (onInsert && payload.new) {
          onInsert(payload.new as ConfessionPayload);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "confessions",
      },
      (payload: RealtimePostgresChangesPayload<ConfessionPayload>) => {
        if (onUpdate && payload.new) {
          onUpdate(payload.new as ConfessionPayload);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "confessions",
      },
      (payload: RealtimePostgresChangesPayload<ConfessionPayload>) => {
        if (onDelete && payload.old) {
          onDelete(payload.old as ConfessionPayload);
        }
      }
    )
    .subscribe();

  channels.set(channelName, channel);
  return channel;
}

/**
 * Subscribe to tip changes for a specific confession
 */
export function subscribeToTips(
  confessionId: string,
  onNewTip: (tip: TipPayload) => void
): RealtimeChannel {
  const channelName = `tips-${confessionId}`;

  if (channels.has(channelName)) {
    return channels.get(channelName)!;
  }

  const channel = getClient()
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "tips",
        filter: `confession_id=eq.${confessionId}`,
      },
      (payload: RealtimePostgresChangesPayload<TipPayload>) => {
        if (payload.new) {
          onNewTip(payload.new as TipPayload);
        }
      }
    )
    .subscribe();

  channels.set(channelName, channel);
  return channel;
}

/**
 * Subscribe to all tips (for leaderboard updates)
 */
export function subscribeToAllTips(
  onNewTip: (tip: TipPayload) => void
): RealtimeChannel {
  const channelName = "all-tips-channel";

  if (channels.has(channelName)) {
    return channels.get(channelName)!;
  }

  const channel = getClient()
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "tips",
      },
      (payload: RealtimePostgresChangesPayload<TipPayload>) => {
        if (payload.new) {
          onNewTip(payload.new as TipPayload);
        }
      }
    )
    .subscribe();

  channels.set(channelName, channel);
  return channel;
}

/**
 * Subscribe to user-specific updates (tips received)
 */
export function subscribeToUserTips(
  userAddress: string,
  onTipReceived: (tip: TipPayload) => void
): RealtimeChannel {
  const channelName = `user-tips-${userAddress}`;

  if (channels.has(channelName)) {
    return channels.get(channelName)!;
  }

  // Subscribe to tips on confessions owned by this user
  const channel = getClient()
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "tips",
      },
      async (payload: RealtimePostgresChangesPayload<TipPayload>) => {
        if (payload.new) {
          const tip = payload.new as TipPayload;
          // Check if this tip is for a confession owned by the user
          const { data: confession } = await getClient()
            .from("confessions")
            .select("author_address")
            .eq("id", tip.confession_id)
            .single();

          if (confession?.author_address === userAddress) {
            onTipReceived(tip);
          }
        }
      }
    )
    .subscribe();

  channels.set(channelName, channel);
  return channel;
}

/**
 * Unsubscribe from a specific channel
 */
export function unsubscribe(channelName: string): void {
  const channel = channels.get(channelName);
  if (channel) {
    getClient().removeChannel(channel);
    channels.delete(channelName);
  }
}

/**
 * Unsubscribe from all channels
 */
export function unsubscribeAll(): void {
  channels.forEach((channel, name) => {
    getClient().removeChannel(channel);
    channels.delete(name);
  });
}

/**
 * Get connection status
 */
export function getConnectionStatus(): string {
  // Check if any channel is connected
  for (const channel of channels.values()) {
    return channel.state;
  }
  return "disconnected";
}

/**
 * Reconnect all channels after network interruption
 */
export async function reconnectAll(): Promise<void> {
  for (const [_name, channel] of channels.entries()) {
    if (channel.state !== "joined") {
      await channel.subscribe();
    }
  }
}
