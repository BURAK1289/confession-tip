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
  accountAssociation: {
    // Generate these at https://base.org/build after deployment
    header: "",
    payload: "",
    signature: "",
  },
  baseBuilder: {
    // Wallet address for Base Builder Rewards program
    allowedAddresses: ["0x16ad3a6F473Ba57Cd944d461E48a327802b63bFa"],
  },
  miniapp: {
    version: "1",
    name: "Confession Tip",
    subtitle: "Share secrets, earn tips",
    description: "Anonymous confessions with USDC tipping on Base. Share your secrets and support others.",
    screenshotUrls: [
      `${ROOT_URL}/screenshots/feed.png`,
      `${ROOT_URL}/screenshots/tip.png`,
      `${ROOT_URL}/screenshots/leaderboard.png`,
    ],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#0052ff",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["social", "tips", "anonymous", "confessions", "base"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Confess. Tip. Connect.",
    ogTitle: "Confession Tip",
    ogDescription: "Share anonymous confessions and tip your favorites with USDC on Base.",
    ogImageUrl: `${ROOT_URL}/hero.png`,
    noindex: process.env.NODE_ENV !== "production",
  },
} as const;
