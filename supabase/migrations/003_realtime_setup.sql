-- Confession Tip Database Schema
-- Migration 003: Realtime Subscriptions Setup

-- ============================================================================
-- ENABLE REALTIME FOR TABLES
-- ============================================================================

-- Enable realtime for confessions table
-- This allows clients to subscribe to INSERT, UPDATE, DELETE events
ALTER PUBLICATION supabase_realtime ADD TABLE confessions;

-- Enable realtime for tips table
-- This allows clients to subscribe to new tips in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE tips;

-- ============================================================================
-- REALTIME FILTERS
-- ============================================================================

-- Note: Realtime filters are configured on the client side
-- Clients can subscribe to specific events like:
-- - New confessions: INSERT on confessions
-- - Tip updates: INSERT on tips
-- - Confession updates: UPDATE on confessions (for tip count changes)

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE confessions IS 'Stores anonymous confession posts with AI-generated categories. Realtime enabled for live feed updates.';
COMMENT ON TABLE tips IS 'Records all tip transactions with blockchain hashes. Realtime enabled for live tip notifications.';
COMMENT ON TABLE users IS 'User profiles with statistics and referral codes.';
COMMENT ON TABLE referrals IS 'Tracks referral relationships and bonus payments.';

COMMENT ON COLUMN confessions.author_address IS 'Ethereum wallet address - kept private, not exposed in public API';
COMMENT ON COLUMN confessions.deleted_at IS 'Soft delete timestamp - confessions are never hard deleted';
COMMENT ON COLUMN tips.tx_hash IS 'Ethereum transaction hash from Base network';
COMMENT ON COLUMN users.referral_code IS 'Unique 8-character referral code for user invites';
