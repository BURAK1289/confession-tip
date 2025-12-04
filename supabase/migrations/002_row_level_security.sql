-- Confession Tip Database Schema
-- Migration 002: Row Level Security (RLS) Policies
-- 
-- Note: This app uses wallet-based authentication (not Supabase Auth)
-- RLS policies are permissive to allow API-level authentication
-- Server-side API routes will handle wallet verification

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CONFESSIONS POLICIES
-- ============================================================================

-- Policy: Anyone can read non-deleted confessions
CREATE POLICY "confessions_public_read" ON confessions
  FOR SELECT
  USING (deleted_at IS NULL);

-- Policy: Allow insert (API will verify wallet ownership)
CREATE POLICY "confessions_allow_insert" ON confessions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow update (API will verify wallet ownership)
CREATE POLICY "confessions_allow_update" ON confessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TIPS POLICIES
-- ============================================================================

-- Policy: Anyone can read tips
CREATE POLICY "tips_public_read" ON tips
  FOR SELECT
  USING (true);

-- Policy: Allow insert (API will verify transaction)
CREATE POLICY "tips_allow_insert" ON tips
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- USERS POLICIES
-- ============================================================================

-- Policy: Anyone can read user data (wallet addresses are public on blockchain)
CREATE POLICY "users_public_read" ON users
  FOR SELECT
  USING (true);

-- Policy: Allow insert for new users
CREATE POLICY "users_allow_insert" ON users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow update (API will verify wallet ownership)
CREATE POLICY "users_allow_update" ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- REFERRALS POLICIES
-- ============================================================================

-- Policy: Anyone can read referrals
CREATE POLICY "referrals_public_read" ON referrals
  FOR SELECT
  USING (true);

-- Policy: Allow insert (API will verify)
CREATE POLICY "referrals_allow_insert" ON referrals
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT SELECT ON confessions TO anon, authenticated;
GRANT INSERT ON confessions TO authenticated;
GRANT UPDATE ON confessions TO authenticated;

GRANT SELECT ON tips TO anon, authenticated;
GRANT INSERT ON tips TO authenticated;

GRANT SELECT, INSERT, UPDATE ON users TO anon, authenticated;

GRANT SELECT, INSERT ON referrals TO authenticated;

-- Grant permissions on sequences (for auto-increment if needed)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
