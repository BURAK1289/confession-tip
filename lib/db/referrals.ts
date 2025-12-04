import { supabaseServer } from "@/lib/supabase/server";
import type { Referral } from "@/types";
import { DatabaseError } from "@/types";

export async function createReferral(
  referrerAddress: string,
  refereeAddress: string,
  bonusTransactionHash?: string
): Promise<Referral> {
  const { data, error } = await supabaseServer
    .from("referrals")
    .insert({
      referrer_address: referrerAddress,
      referee_address: refereeAddress,
      bonus_transaction_hash: bonusTransactionHash,
    })
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to create referral: ${error.message}`);
  }

  return data;
}

export async function getReferralByAddresses(
  referrerAddress: string,
  refereeAddress: string
): Promise<Referral | null> {
  const { data, error } = await supabaseServer
    .from("referrals")
    .select("*")
    .eq("referrer_address", referrerAddress)
    .eq("referee_address", refereeAddress)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new DatabaseError(`Failed to fetch referral: ${error.message}`);
  }

  return data;
}

export async function getReferralsByReferrer(
  referrerAddress: string
): Promise<Referral[]> {
  const { data, error } = await supabaseServer
    .from("referrals")
    .select("*")
    .eq("referrer_address", referrerAddress)
    .order("created_at", { ascending: false });

  if (error) {
    throw new DatabaseError(`Failed to fetch referrals: ${error.message}`);
  }

  return data || [];
}

export async function getReferralCount(referrerAddress: string): Promise<number> {
  const { count, error } = await supabaseServer
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_address", referrerAddress);

  if (error) {
    throw new DatabaseError(`Failed to count referrals: ${error.message}`);
  }

  return count || 0;
}
