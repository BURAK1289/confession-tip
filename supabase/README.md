# Supabase Database Setup

This directory contains SQL migration files for the Confession Tip database schema.

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Get your project credentials:
   - Project URL: `https://[project-id].supabase.co`
   - Anon Key: Public key for client-side access
   - Service Role Key: Secret key for server-side access (keep secure!)

## Running Migrations

### Option 1: Supabase Dashboard (Recommended for first setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of each migration file in order:
   - `001_initial_schema.sql`
   - `002_row_level_security.sql`
   - `003_realtime_setup.sql`
5. Click **Run** for each migration

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref [your-project-id]

# Run migrations
supabase db push
```

## Migration Files

### 001_initial_schema.sql
Creates the core database tables:
- `confessions` - Anonymous confession posts
- `tips` - Tip transaction records
- `users` - User profiles and statistics
- `referrals` - Referral tracking

Also includes:
- Indexes for query performance
- Check constraints for data validation
- Triggers for auto-updating timestamps
- Function for generating unique referral codes

### 002_row_level_security.sql
Sets up Row Level Security (RLS) policies:
- Public read access for confessions and tips
- Authenticated insert/update permissions
- User-specific access controls
- Privacy protection for wallet addresses

### 003_realtime_setup.sql
Enables Realtime subscriptions:
- Live updates for new confessions
- Real-time tip notifications
- Table documentation comments

## Verifying Setup

After running migrations, verify the setup:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```

## Environment Variables

Add these to your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Testing Database Connection

Create a test file to verify connection:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Test query
const { data, error } = await supabase
  .from('confessions')
  .select('count');

console.log('Connection test:', { data, error });
```

## Troubleshooting

### RLS Policies Not Working
- Ensure you're using the correct authentication method
- Check that `auth.uid()` matches your wallet address format
- Verify policies are enabled: `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;`

### Realtime Not Working
- Confirm Realtime is enabled in Supabase dashboard (Database > Replication)
- Check that tables are added to the publication
- Verify client-side subscription code

### Migration Errors
- Run migrations in order (001, 002, 003)
- Check for syntax errors in SQL
- Ensure UUID extension is enabled
- Verify no duplicate table/index names

## Next Steps

After database setup:
1. Test connection from Next.js app
2. Create Supabase client utilities (`lib/supabase/client.ts`)
3. Implement database query helpers
4. Set up Realtime subscriptions in React components
