import { useQueryClient } from "@tanstack/react-query";
import type { Confession } from "@/types";

/**
 * Hook for optimistic updates to improve UX
 * Updates cache immediately before server response
 */
export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  /**
   * Optimistically add a new confession to the cache
   */
  const addConfessionOptimistically = (confession: Confession) => {
    queryClient.setQueriesData<{
      confessions: Confession[];
      hasMore: boolean;
    }>(
      { queryKey: ["confessions"] },
      (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          confessions: [confession, ...oldData.confessions],
        };
      }
    );
  };

  /**
   * Optimistically update confession tip stats
   */
  const updateConfessionTipsOptimistically = (
    confessionId: string,
    tipAmount: number
  ) => {
    queryClient.setQueriesData<{
      confessions: Confession[];
      hasMore: boolean;
    }>(
      { queryKey: ["confessions"] },
      (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          confessions: oldData.confessions.map((confession) =>
            confession.id === confessionId
              ? {
                  ...confession,
                  total_tips: confession.total_tips + tipAmount,
                  tip_count: confession.tip_count + 1,
                }
              : confession
          ),
        };
      }
    );

    // Also update single confession query if it exists
    queryClient.setQueryData<Confession>(
      ["confession", confessionId],
      (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          total_tips: oldData.total_tips + tipAmount,
          tip_count: oldData.tip_count + 1,
        };
      }
    );
  };

  /**
   * Rollback optimistic update on error
   */
  const rollbackOptimisticUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["confessions"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  return {
    addConfessionOptimistically,
    updateConfessionTipsOptimistically,
    rollbackOptimisticUpdate,
  };
}
