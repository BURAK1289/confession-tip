# Vercel Deployment & Base Registration Guide

This guide walks you through deploying Confession Tip to Vercel and registering it on Base Mini Apps.

## Prerequisites

- GitHub account with the repository pushed
- Vercel account (free tier works)
- Base wallet with some ETH for gas (for account association signing)
- Production Supabase project set up (see DEPLOYMENT-CHECKLIST.md)

---

## Step 1: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `my-minikit-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variables (click "Environment Variables"):

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-prod-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-production-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-production-service-role-key]
NEXT_PUBLIC_ONCHAINKIT_API_KEY=[your-onchainkit-api-key]
NEXT_PUBLIC_CDP_PROJECT_ID=[your-cdp-project-id]
OPENAI_API_KEY=[your-openai-api-key]
NEXT_PUBLIC_APP_NAME=Confession Tip
NEXT_PUBLIC_PROJECT_NAME=Confession Tip
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
SENTRY_DSN=[your-sentry-dsn]
```

6. Click "Deploy"
7. Wait for the build to complete (usually 2-3 minutes)
8. Note your deployment URL: `https://[project-name].vercel.app`

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from the my-minikit-app directory
cd my-minikit-app
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name? confession-tip
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

---

## Step 2: Verify Production Deployment

After deployment, test these endpoints:

1. **Homepage**: `https://[your-domain].vercel.app`
   - Should load the confession feed

2. **Health Check**: `https://[your-domain].vercel.app/api/health`
   - Should return `{"status": "healthy", ...}`

3. **Farcaster Manifest**: `https://[your-domain].vercel.app/.well-known/farcaster.json`
   - Should return the app manifest

4. **Stats API**: `https://[your-domain].vercel.app/api/stats`
   - Should return platform statistics

---

## Step 3: Update NEXT_PUBLIC_URL

After getting your production URL:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add or update: `NEXT_PUBLIC_URL=https://[your-domain].vercel.app`
3. Redeploy: Go to Deployments → Click "..." on latest → "Redeploy"

---

## Step 4: Generate Account Association (Base Registration)

1. Go to [https://base.org/build](https://base.org/build)
2. Connect your Base wallet (this will be the owner address)
3. Enter your production domain: `[your-domain].vercel.app`
4. Sign the message with your wallet
5. Copy the generated values:
   - `header`
   - `payload`
   - `signature`

---

## Step 5: Update minikit.config.ts

Update the `minikit.config.ts` file with your account association:

```typescript
export const minikitConfig = {
  accountAssociation: {
    header: "YOUR_HEADER_VALUE",
    payload: "YOUR_PAYLOAD_VALUE",
    signature: "YOUR_SIGNATURE_VALUE",
  },
  baseBuilder: {
    ownerAddress: "0xYOUR_WALLET_ADDRESS", // The wallet you signed with
  },
  // ... rest of config
} as const;
```

---

## Step 6: Redeploy with Updated Config

After updating `minikit.config.ts`:

```bash
# Commit and push changes
git add minikit.config.ts
git commit -m "Add account association for Base registration"
git push

# Vercel will auto-deploy, or manually trigger:
vercel --prod
```

---

## Step 7: Submit to Base Mini Apps Directory

1. Go to [https://base.org/build](https://base.org/build)
2. Navigate to "Submit App" or "Register Mini App"
3. Enter your production URL
4. Verify your manifest is valid
5. Submit for review

---

## Step 8: Announce on Farcaster

Share your launch on Farcaster:

```
🎉 Just launched Confession Tip on @base!

Share anonymous confessions and tip your favorites with USDC. 
Gasless transactions powered by @coinbase.

Try it: https://[your-domain].vercel.app

Built with @onchainkit #BaseMiniApp
```

---

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Run `npm run build` locally to debug

### Manifest Not Found

1. Verify `/.well-known/farcaster.json` route exists
2. Check `vercel.json` rewrites are correct
3. Clear Vercel cache and redeploy

### Account Association Invalid

1. Ensure domain matches exactly (no trailing slash)
2. Re-sign with the same wallet
3. Check header/payload/signature are copied correctly

### Database Connection Issues

1. Verify Supabase URL and keys are correct
2. Check RLS policies allow the operations
3. Test with `/api/health` endpoint

---

## Post-Deployment Checklist

- [ ] Homepage loads correctly
- [ ] Wallet connection works
- [ ] Can create a confession
- [ ] Can tip a confession
- [ ] Leaderboard displays
- [ ] Profile page works
- [ ] Real-time updates work
- [ ] Share to Farcaster works
- [ ] Health check returns healthy
- [ ] Manifest is valid at /.well-known/farcaster.json
- [ ] Account association is verified on Base

---

## Monitoring Links

After deployment, bookmark these:

- **Vercel Dashboard**: https://vercel.com/[team]/confession-tip
- **Vercel Analytics**: https://vercel.com/[team]/confession-tip/analytics
- **Supabase Dashboard**: https://supabase.com/dashboard/project/[ref]
- **Sentry Dashboard**: https://sentry.io/organizations/[org]/projects/confession-tip
- **Base Builder**: https://base.org/build

---

## Custom Domain (Optional)

To add a custom domain:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `confessiontip.xyz`)
3. Configure DNS:
   - A record: `76.76.21.21`
   - Or CNAME: `cname.vercel-dns.com`
4. Wait for SSL certificate (usually instant)
5. Update `NEXT_PUBLIC_URL` environment variable
6. Re-generate account association with new domain
7. Redeploy
