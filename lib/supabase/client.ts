import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance (only for client-side)
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get Supabase client instance
 * Safe to call on both server and client
 */
export function getSupabase(): SupabaseClient {
  // Server-side: always create new instance without persistence
  if (typeof window === "undefined") {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // Client-side: use singleton with persistence
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: {
          getItem: (key) => {
            try {
              return window.localStorage.getItem(key);
            } catch {
              return null;
            }
          },
          setItem: (key, value) => {
            try {
              window.localStorage.setItem(key, value);
            } catch {
              // Ignore
            }
          },
          removeItem: (key) => {
            try {
              window.localStorage.removeItem(key);
            } catch {
              // Ignore
            }
          },
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseInstance;
}

// Lazy-loaded export for backward compatibility
// DO NOT use this directly - use getSupabase() instead
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as Record<string, unknown>)[prop as string];
  },
});

// Factory function
export const createClient = () => getSupabase();
