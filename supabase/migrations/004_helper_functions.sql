-- Helper functions for atomic updates

-- Increment user confessions count
CREATE OR REPLACE FUNCTION increment_user_confessions(user_address TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET total_confessions = total_confessions + 1,
      updated_at = NOW()
  WHERE address = user_address;
END;
$$ LANGUAGE plpgsql;

-- Increment user tips given
CREATE OR REPLACE FUNCTION increment_user_tips_given(user_address TEXT, tip_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET total_tips_given = total_tips_given + tip_amount,
      updated_at = NOW()
  WHERE address = user_address;
END;
$$ LANGUAGE plpgsql;

-- Increment user tips received
CREATE OR REPLACE FUNCTION increment_user_tips_received(user_address TEXT, tip_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET total_tips_received = total_tips_received + tip_amount,
      updated_at = NOW()
  WHERE address = user_address;
END;
$$ LANGUAGE plpgsql;

-- Increment user referrals
CREATE OR REPLACE FUNCTION increment_user_referrals(user_address TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET referral_count = referral_count + 1,
      updated_at = NOW()
  WHERE address = user_address;
END;
$$ LANGUAGE plpgsql;

-- Increment confession tips (atomic update)
CREATE OR REPLACE FUNCTION update_confession_tips(
  confession_id UUID,
  tip_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE confessions
  SET total_tips = total_tips + tip_amount,
      tip_count = tip_count + 1,
      updated_at = NOW()
  WHERE id = confession_id;
END;
$$ LANGUAGE plpgsql;
