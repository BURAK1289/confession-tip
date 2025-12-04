const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  // accountAssociation is required for Farcaster verification
  // Generate these by running: npx create-onchain --manifest
  // Or manually sign your domain with your Farcaster custody wallet
  ...(process.env.FARCASTER_HEADER &&
    process.env.FARCASTER_PAYLOAD &&
    process.env.FARCASTER_SIGNATURE && {
      accountAssociation: {
        header: process.env.FARCASTER_HEADER,
        payload: process.env.FARCASTER_PAYLOAD,
        signature: process.env.FARCASTER_SIGNATURE,
      },
    }),
  baseBuilder: {
    // Wallet address for Base Builder Rewards program
    ownerAddress: "0xf30Dd3a945a12aaEAE3f355Ba0212d6256e6c8d9",
  },
  miniapp: {
    version: "1",
    name: "Confession Tip",
    subtitle: "Anonymous tips on Base", // Max 30 chars
    description: "Share anonymous confessions and tip your favorites with USDC on Base. A fun, social app for sharing secrets safely.",
    screenshotUrls: [
      `${ROOT_URL}/screenshots/feed.png`,
      `${ROOT_URL}/screenshots/tip.png`,
      `${ROOT_URL}/screenshots/leaderboard.png`,
    ],
    iconUrl: `${ROOT_URL}/logo-512.png`, // TODO: Replace with 1024x1024px PNG, no alpha
    splashImageUrl: `${ROOT_URL}/splash.png`, // TODO: Replace with 200x200px
    splashBackgroundColor: "#0052ff",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["social", "tips", "anonymous", "confessions", "base"],
    heroImageUrl: `${ROOT_URL}/banner.png`, // 1200x630px
    tagline: "Confess and tip on Base", // Max 30 chars
    ogTitle: "Confession Tip",
    ogDescription: "Share anonymous confessions and tip your favorites with USDC on Base.",
    ogImageUrl: `${ROOT_URL}/banner.png`,
    noindex: process.env.NODE_ENV !== "production",
  },
};
