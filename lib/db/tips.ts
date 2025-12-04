import { supabaseServer } from "@/lib/supabase/server";
import type { Tip } from "@/types";
import { DatabaseError } from "@/types";

export async function createTip(
  confessionId: string,
  tipperAddress: string,
  amount: number,
  transactionHash: string
): Promise<Tip> {
  const { data, error } = await supabaseServer
    .from("tips")
    .insert({
      confession_id: confessionId,
      tipper_address: tipperAddress,
      amount,
      transaction_hash: transactionHash,
    })
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to create tip: ${error.message}`);
  }

  return data;
}

export async function getTipsByConfession(confessionId: string): Promise<Tip[]> {
  const { data, error } = await supabaseServer
    .from("tips")
    .select("*")
    .eq("confession_id", confessionId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new DatabaseError(`Failed to fetch tips: ${error.message}`);
  }

  return data || [];
}

export async function getTipsByTipper(tipperAddress: string): Promise<Tip[]> {
  const { data, error } = await supabaseServer
    .from("tips")
    .select("*")
    .eq("tipper_address", tipperAddress)
    .order("created_at", { ascending: false });

  if (error) {
    throw new DatabaseError(`Failed to fetch tipper tips: ${error.message}`);
  }

  return data || [];
}

export async function getTipByTransactionHash(
  transactionHash: string
): Promise<Tip | null> {
  const { data, error } = await supabaseServer
    .from("tips")
    .select("*")
    .eq("transaction_hash", transactionHash)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new DatabaseError(`Failed to fetch tip: ${error.message}`);
  }

  return data;
}

export async function getTotalTipAmount(confessionId: string): Promise<number> {
  const { data, error } = await supabaseServer
    .from("tips")
    .select("amount")
    .eq("confession_id", confessionId);

  if (error) {
    throw new DatabaseError(`Failed to calculate total tips: ${error.message}`);
  }

  return (data || []).reduce((sum, tip) => sum + tip.amount, 0);
}
