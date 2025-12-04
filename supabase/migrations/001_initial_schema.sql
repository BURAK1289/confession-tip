-- Confession Tip Database Schema
-- Migration 001: Initial Schema Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: confessions
-- Stores anonymous confession posts with AI-generated categories
-- ============================================================================
CREATE TABLE confessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL CHECK (char_length(text) >= 10 AND char_length(text) <= 500),
  category VARCHAR(20) NOT NULL CHECK (category IN ('funny', 'deep', 'relationship', 'work', 'random', 'wholesome', 'regret')),
  author_address VARCHAR(42) NOT NULL,
  total_tips DECIMAL(18, 6) DEFAULT 0 CHECK (total_tips >= 0),
  tip_count INTEGER DEFAULT 0 CHECK (tip_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance optimization
CREATE INDEX idx_confessions_category ON confessions(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_confessions_created_at ON confessions(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_confessions_total_tips ON confessions(total_tips DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_confessions_author ON confessions(author_address) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: tips
-- Records all tip transactions with blockchain transaction hashes
-- ============================================================================
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id UUID NOT NULL REFERENCES confessions(id) ON DELETE CASCADE,
  tipper_address VARCHAR(42) NOT NULL,
  amount DECIMAL(18, 6) NOT NULL CHECK (amount > 0),
  tx_hash VARCHAR(66) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for tips
CREATE INDEX idx_tips_confession ON tips(confession_id);
CREATE INDEX idx_tips_tipper ON tips(tipper_address);
CREATE INDEX idx_tips_tx_hash ON tips(tx_hash);

-- ============================================================================
-- TABLE: users
-- User profiles with statistics and referral codes
-- ============================================================================
CREATE TABLE users (
  address VARCHAR(42) PRIMARY KEY,
  total_confessions INTEGER DEFAULT 0 CHECK (total_confessions >= 0),
  total_tips_received DECIMAL(18, 6) DEFAULT 0 CHECK (total_tips_received >= 0),
  total_tips_given DECIMAL(18, 6) DEFAULT 0 CHECK (total_tips_given >= 0),
  referral_code VARCHAR(10) UNIQUE NOT NULL,
  referred_by VARCHAR(42) REFERENCES users(address),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for referral code lookups
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- ============================================================================
-- TABLE: referrals
-- Tracks referral relationships and bonus payments
-- ============================================================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_address VARCHAR(42) NOT NULL REFERENCES users(address) ON DELETE CASCADE,
  referee_address VARCHAR(42) NOT NULL REFERENCES users(address) ON DELETE CASCADE,
  bonus_amount DECIMAL(18, 6) DEFAULT 0.01 CHECK (bonus_amount > 0),
  bonus_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(referrer_address, referee_address)
);

-- Index for referrer lookups
CREATE INDEX idx_referrals_referrer ON referrals(referrer_address);

-- ============================================================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for confessions
CREATE TRIGGER update_confessions_updated_at
  BEFORE UPDATE ON confessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS: Generate unique referral codes
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
