# Deployment Checklist - Confession Tip

## Pre-Deployment Checklist

### 1. Production Supabase Project Setup

- [ ] Create a new Supabase project for production at https://supabase.com/dashboard
- [ ] Note down the following credentials:
  - Project URL: `https://[project-ref].supabase.co`
  - Anon Key (public): `eyJ...`
  - Service Role Key (private): `eyJ...`
  - Database Password

### 2. Run Database Migrations on Production

Execute migrations in order on the production Supabase SQL Editor:

```bash
# Option 1: Via Supabase CLI (recommended)
npx supabase link --project-ref [your-project-ref]
npx supabase db push

# Option 2: Manual execution in SQL Editor
# Run each file in order:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_row_level_security.sql
# 3. supabase/migrations/003_realtime_setup.sql
# 4. supabase/migrations/004_helper_functions.sql
```

- [ ] Verify tables created: `confessions`, `tips`, `users`, `referrals`
- [ ] Verify RLS policies are active
- [ ] Enable Realtime for `confessions` and `tips` tables in Supabase Dashboard

### 3. Configure Environment Variables in Vercel

Required environment variables for production:

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://[prod-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[production-service-role-key]

# Coinbase Developer Platform
NEXT_PUBLIC_ONCHAINKIT_API_KEY=[your-onchainkit-api-key]
NEXT_PUBLIC_CDP_PROJECT_ID=[your-cdp-project-id]

# OpenAI
OPENAI_API_KEY=[your-openai-api-key]

# App Config
NEXT_PUBLIC_APP_NAME=Confession Tip
NEXT_PUBLIC_PROJECT_NAME=Confession Tip
NEXT_PUBLIC_URL=https://your-domain.vercel.app

# Base Network (Mainnet)
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Error Monitoring (Sentry)
SENTRY_DSN=[your-sentry-dsn]
SENTRY_AUTH_TOKEN=[your-sentry-auth-token]

# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=[your-posthog-key]
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 4. Vercel Deployment Setup

- [ ] Connect GitHub repository to Vercel
- [ ] Set root directory to `my-minikit-app`
- [ ] Configure build settings:
  - Framework Preset: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`
- [ ] Add all environment variables from step 3
- [ ] Enable automatic deployments on push to main branch

### 5. Custom Domain Setup (Optional)

- [ ] Add custom domain in Vercel project settings
- [ ] Configure DNS records:
  - A record: `76.76.21.21`
  - CNAME record: `cname.vercel-dns.com`
- [ ] Wait for SSL certificate provisioning
- [ ] Update `NEXT_PUBLIC_URL` environment variable

### 6. CDN and Caching Configuration

Vercel automatically provides:
- [ ] Global CDN distribution
- [ ] Automatic static asset caching
- [ ] Edge caching for API routes (configure in `next.config.ts` if needed)

Additional caching headers are configured in API routes:
- Feed API: 60 second cache
- Leaderboard API: 300 second cache (5 minutes)
- Stats API: 60 second cache

### 7. Error Monitoring Setup (Sentry)

- [ ] Create Sentry project at https://sentry.io
- [ ] Install Sentry SDK (already configured in project)
- [ ] Add `SENTRY_DSN` to Vercel environment variables
- [ ] Configure source maps upload (optional but recommended)
- [ ] Set up alert rules for critical errors
- [ ] Configure error grouping and filtering

### 8. Uptime Monitoring Setup

Choose one of the following:
- [ ] **Vercel Analytics** (built-in): Enable in Vercel dashboard
- [ ] **UptimeRobot** (free): https://uptimerobot.com
  - Monitor: `https://your-domain.vercel.app/api/stats`
  - Interval: 5 minutes
  - Alert contacts: Your email/Slack
- [ ] **Better Uptime** (alternative): https://betteruptime.com

### 9. Base Mini App Registration

- [ ] Deploy to Vercel production first
- [ ] Generate account association at https://base.org/build
- [ ] Update `minikit.config.ts` with:
  - `accountAssociation.header`
  - `accountAssociation.payload`
  - `accountAssociation.signature`
  - `baseBuilder.ownerAddress` (your Base wallet address)
- [ ] Redeploy with updated config
- [ ] Submit app to Base Mini Apps directory

---

## Post-Deployment Verification

### Functional Tests

- [ ] Homepage loads correctly
- [ ] Wallet connection works
- [ ] Can create a confession
- [ ] Can view confession feed
- [ ] Can tip a confession (test with small amount)
- [ ] Leaderboard displays correctly
- [ ] Profile page shows user stats
- [ ] Real-time updates work (open two tabs)
- [ ] Share to Farcaster works
- [ ] Dark mode toggle works

### Performance Tests

- [ ] Initial page load < 2 seconds
- [ ] API response times < 500ms
- [ ] No console errors in production
- [ ] Images load correctly

### Security Checks

- [ ] Environment variables not exposed in client
- [ ] RLS policies working (test unauthorized access)
- [ ] Rate limiting active
- [ ] HTTPS enforced

---

## Rollback Plan

If issues occur after deployment:

1. **Immediate rollback**: Use Vercel's instant rollback feature
2. **Database rollback**: Restore from Supabase point-in-time recovery
3. **Environment fix**: Update environment variables and redeploy

---

## Monitoring Dashboard Links

After setup, bookmark these:

- Vercel Dashboard: https://vercel.com/[team]/confession-tip
- Supabase Dashboard: https://supabase.com/dashboard/project/[project-ref]
- Sentry Dashboard: https://sentry.io/organizations/[org]/projects/confession-tip
- Uptime Monitor: [Your monitoring service URL]

---

## Support Contacts

- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Base Builder Support: https://discord.gg/buildonbase
