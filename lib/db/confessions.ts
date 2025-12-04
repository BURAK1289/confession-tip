import { supabaseServer } from "@/lib/supabase/server";
import type {
  Confession,
  ConfessionCategory,
  PaginationParams,
} from "@/types";
import { DatabaseError } from "@/types";

export async function createConfession(
  text: string,
  category: ConfessionCategory,
  authorAddress: string
): Promise<Confession> {
  const { data, error } = await supabaseServer
    .from("confessions")
    .insert({
      text,
      category,
      author_address: authorAddress,
    })
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to create confession: ${error.message}`);
  }

  return data;
}

export async function getConfessions(
  params: PaginationParams,
  category?: ConfessionCategory,
  sort: "recent" | "top" = "recent"
): Promise<{ confessions: Confession[]; total: number }> {
  let query = supabaseServer.from("confessions").select("*", { count: "exact" });

  // Apply category filter
  if (category) {
    query = query.eq("category", category);
  }

  // Apply sorting
  if (sort === "top") {
    query = query.order("total_tips", { ascending: false }).order("tip_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Apply pagination
  query = query.range(params.offset, params.offset + params.limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new DatabaseError(`Failed to fetch confessions: ${error.message}`);
  }

  return {
    confessions: data || [],
    total: count || 0,
  };
}

export async function getConfessionById(id: string): Promise<Confession | null> {
  const { data, error } = await supabaseServer
    .from("confessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new DatabaseError(`Failed to fetch confession: ${error.message}`);
  }

  return data;
}

export async function getConfessionsByAuthor(
  authorAddress: string,
  limit = 50
): Promise<Confession[]> {
  const { data, error } = await supabaseServer
    .from("confessions")
    .select("*")
    .eq("author_address", authorAddress)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new DatabaseError(`Failed to fetch user confessions: ${error.message}`);
  }

  return data || [];
}

export async function updateConfessionTips(
  confessionId: string,
  tipAmount: number
): Promise<Confession> {
  // Use RPC function for atomic update
  const { error: rpcError } = await supabaseServer.rpc("update_confession_tips", {
    confession_id: confessionId,
    tip_amount: tipAmount,
  });

  if (rpcError) {
    throw new DatabaseError(`Failed to update confession tips: ${rpcError.message}`);
  }

  // Fetch updated confession
  const { data, error } = await supabaseServer
    .from("confessions")
    .select("*")
    .eq("id", confessionId)
    .single();

  if (error) {
    throw new DatabaseError(`Failed to fetch updated confession: ${error.message}`);
  }

  return data;
}

export async function getLeaderboard(limit = 50): Promise<Confession[]> {
  const { data, error } = await supabaseServer
    .from("confessions")
    .select("*")
    .order("total_tips", { ascending: false })
    .order("tip_count", { ascending: false })
    .limit(limit);

  if (error) {
    throw new DatabaseError(`Failed to fetch leaderboard: ${error.message}`);
  }

  return data || [];
}
