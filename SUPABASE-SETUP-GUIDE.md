# 🗄️ Supabase Database Setup Guide

## ✅ What's Been Created

Task 1 has created all the necessary database migration files and setup scripts:

### 📁 Files Created:
1. **`supabase/migrations/001_initial_schema.sql`** - Core database tables and indexes
2. **`supabase/migrations/002_row_level_security.sql`** - Security policies
3. **`supabase/migrations/003_realtime_setup.sql`** - Real-time subscriptions
4. **`supabase/README.md`** - Detailed setup instructions
5. **`scripts/test-db-connection.ts`** - Connection test script

### 🗃️ Database Tables:
- **confessions** - Anonymous confession posts (with indexes for performance)
- **tips** - Tip transaction records
- **users** - User profiles and statistics
- **referrals** - Referral tracking

## 🚀 Next Steps - Run These Commands

### Step 1: Get Real Supabase Keys

Your `.env` file has placeholder values. You need to get the real keys:

1. Go to your Supabase project: https://supabase.com/dashboard/project/pmidoizsrotjaigdbhaw
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL** → Already correct: `https://pmidoizsrotjaigdbhaw.supabase.co`
   - **anon public** key → Replace `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → Replace `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### Step 2: Run Database Migrations

Go to Supabase Dashboard → **SQL Editor** and run each migration file:

```bash
# 1. Copy contents of: supabase/migrations/001_initial_schema.sql
# 2. Paste in SQL Editor and click "Run"
# 3. Repeat for 002_row_level_security.sql
# 4. Repeat for 003_realtime_setup.sql
```

### Step 3: Enable Realtime

1. Go to **Database** → **Replication** in Supabase dashboard
2. Enable replication for these tables:
   - ✅ confessions
   - ✅ tips

### Step 4: Test Connection

After updating `.env` with real keys and running migrations:

```bash
cd my-minikit-app
npm install dotenv tsx @supabase/supabase-js
npm run test:db
```

You should see:
```
✅ Confessions table accessible
✅ Tips table accessible
✅ Users table accessible
✅ Referrals table accessible
✅ RLS policies working correctly
✅ Realtime subscriptions working
```

## 📊 Database Schema Overview

### Confessions Table
```sql
- id (UUID, primary key)
- text (10-500 characters)
- category (funny, deep, relationship, work, random, wholesome, regret)
- author_address (wallet address - kept private)
- total_tips (USDC amount)
- tip_count (number of tips)
- created_at, updated_at, deleted_at
```

### Tips Table
```sql
- id (UUID, primary key)
- confession_id (foreign key)
- tipper_address (wallet address)
- amount (USDC)
- tx_hash (blockchain transaction hash)
- created_at
```

### Users Table
```sql
- address (wallet address, primary key)
- total_confessions, total_tips_received, total_tips_given
- referral_code (unique 8-char code)
- referred_by (optional)
- created_at, updated_at
```

### Referrals Table
```sql
- id (UUID, primary key)
- referrer_address, referee_address
- bonus_amount (default 0.01 USDC)
- bonus_paid (boolean)
- created_at
```

## 🔒 Security Features

✅ **Row Level Security (RLS)** enabled on all tables
✅ **Public read** for confessions and tips
✅ **Authenticated write** for creating confessions and tips
✅ **User-specific access** for profiles and referrals
✅ **Wallet privacy** - author addresses hidden from public API

## 📈 Performance Optimizations

✅ **Indexes** on frequently queried columns:
- Category filtering
- Time-based sorting
- Tip amount sorting
- Author lookups

✅ **Check constraints** for data validation
✅ **Auto-updating timestamps** via triggers
✅ **Soft deletes** for confessions (never hard delete)

## ❓ Troubleshooting

### "Table does not exist" error
→ Run migrations in Supabase SQL Editor

### "RLS policy violation" error
→ Check that RLS policies are enabled (migration 002)

### "Realtime not working" error
→ Enable replication in Database → Replication settings

### Connection test fails
→ Verify `.env` has correct Supabase URL and keys

## ✨ Task 1 Complete!

Once you've:
1. ✅ Updated `.env` with real Supabase keys
2. ✅ Run all 3 migration files in SQL Editor
3. ✅ Enabled Realtime replication
4. ✅ Tested connection with `npm run test:db`

You're ready to move to **Task 2: Configure Environment Variables and Project Setup**!

---

**Need help?** Check `supabase/README.md` for detailed instructions.
