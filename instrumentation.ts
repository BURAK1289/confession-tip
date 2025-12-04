// Instrumentation file for Next.js
// Polyfill localStorage for Node.js 25+

export async function register() {
  // Polyfill localStorage if it's not a proper object
  if (typeof globalThis.localStorage !== "undefined") {
    const storage = globalThis.localStorage;
    if (typeof storage.getItem !== "function") {
      // Node.js 25 has localStorage but it's not functional
      const memoryStorage: Record<string, string> = {};
      
      (globalThis as Record<string, unknown>).localStorage = {
        getItem: (key: string) => memoryStorage[key] ?? null,
        setItem: (key: string, value: string) => {
          memoryStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete memoryStorage[key];
        },
        clear: () => {
          Object.keys(memoryStorage).forEach((key) => delete memoryStorage[key]);
        },
        key: (index: number) => Object.keys(memoryStorage)[index] ?? null,
        get length() {
          return Object.keys(memoryStorage).length;
        },
      };
    }
  }

  // Load Sentry in production
  const SENTRY_DSN = process.env.SENTRY_DSN;

  if (SENTRY_DSN && process.env.NODE_ENV === "production") {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("./sentry.server.config");
    }

    if (process.env.NEXT_RUNTIME === "edge") {
      await import("./sentry.edge.config");
    }
  }
}
