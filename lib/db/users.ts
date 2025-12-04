import { supabaseServer } from "@/lib/supabase/server";
import type { User } from "@/types";
import { DatabaseError } from "@/types";

export async function getOrCreateUser(address: string): Promise<User> {
  // Try to get existing user
  const { data: existingUser, error: fetchError } = await supabaseServer
    .from("users")
    .select("*")
    .eq("address", address)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // Create new user if not found
  if (fetchError && fetchError.code === "PGRST116") {
    const referralCode = generateReferralCode(address);
    
    const { data: newUser, error: createError } = await supabaseServer
      .from("users")
      .insert({
        address,
        referral_code: referralCode,
      })
      .select()
      .single();

    if (createError) {
      throw new DatabaseError(`Failed to create user: ${createError.message}`);
    }

    return newUser;
  }

  throw new DatabaseError(`Failed to fetch user: ${fetchError?.message || "Unknown error"}`);
}

export async function getUserByAddress(address: string): Promise<User | null> {
  const { data, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("address", address)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new DatabaseError(`Failed to fetch user: ${error.message}`);
  }

  return data;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("referral_code", code)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new DatabaseError(`Failed to fetch user by referral code: ${error.message}`);
  }

  return data;
}

export async function updateUserStats(
  address: string,
  updates: {
    total_confessions?: number;
    total_tips_received?: number;
    total_tips_given?: number;
    referral_count?: number;
  }
): Promise<User> {
  const { data, error } = await supabaseServer
    .from("users")
    .update(updates)
    .eq("address", address)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to update user stats: ${error.message}`);
  }

  return data;
}

export async function incrementUserConfessions(address: string): Promise<void> {
  const { error } = await supabaseServer.rpc("increment_user_confessions", {
    user_address: address,
  });

  if (error) {
    throw new DatabaseError(`Failed to increment confessions: ${error.message}`);
  }
}

export async function incrementUserTipsGiven(
  address: string,
  amount: number
): Promise<void> {
  const { error } = await supabaseServer.rpc("increment_user_tips_given", {
    user_address: address,
    tip_amount: amount,
  });

  if (error) {
    throw new DatabaseError(`Failed to increment tips given: ${error.message}`);
  }
}

export async function incrementUserTipsReceived(
  address: string,
  amount: number
): Promise<void> {
  const { error } = await supabaseServer.rpc("increment_user_tips_received", {
    user_address: address,
    tip_amount: amount,
  });

  if (error) {
    throw new DatabaseError(`Failed to increment tips received: ${error.message}`);
  }
}

export async function incrementUserReferrals(address: string): Promise<void> {
  const { error } = await supabaseServer.rpc("increment_user_referrals", {
    user_address: address,
  });

  if (error) {
    throw new DatabaseError(`Failed to increment referrals: ${error.message}`);
  }
}

// Generate a unique referral code from wallet address
function generateReferralCode(address: string): string {
  // Take last 8 characters of address and convert to uppercase
  const suffix = address.slice(-8).toUpperCase();
  return `REF${suffix}`;
}
