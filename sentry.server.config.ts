// Sentry server configuration - only active in production with SENTRY_DSN
// This file is loaded by Next.js automatically

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN && process.env.NODE_ENV === "production") {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,
      environment: process.env.NODE_ENV,
    });
  });
}

export {};
