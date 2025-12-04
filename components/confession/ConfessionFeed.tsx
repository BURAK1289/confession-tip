'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ConfessionCard } from './ConfessionCard';
import { ConfessionCardSkeleton, EmptyState } from '@/components/ui';
import type { Confession, ConfessionCategory } from '@/types';
import { supabase } from '@/lib/supabase/client';
import styles from './ConfessionFeed.module.css';

export interface ConfessionFeedProps {
  category?: ConfessionCategory | null;
  limit?: number;
  onTip?: (confessionId: string, amount: number) => Promise<void>;
  onShare?: (confessionId: string) => void;
  userAddress?: string;
}

interface FeedResponse {
  confessions: Confession[];
  hasMore: boolean;
  nextOffset: number;
}

const fetchConfessions = async (
  category: ConfessionCategory | null | undefined,
  page: number,
  limit: number
): Promise<FeedResponse> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString(),
    sort: 'recent',
  });

  if (category) {
    params.append('category', category);
  }

  const response = await fetch(`/api/confessions?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch confessions');
  }

  const data = await response.json();
  
  // Add nextOffset for pagination
  return {
    ...data,
    nextOffset: page + 1,
  };
};

export const ConfessionFeed: React.FC<ConfessionFeedProps> = ({
  category,
  limit = 20,
  onTip,
  onShare,
  userAddress,
}) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['confessions', category],
    queryFn: ({ pageParam = 1 }) => fetchConfessions(category, pageParam, limit),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextOffset : undefined;
    },
    initialPageParam: 1,
  });

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('confessions-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'confessions',
          filter: category ? `category=eq.${category}` : undefined,
        },
        () => {
          // Refetch when new confession is added
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'confessions',
        },
        () => {
          // Refetch when confession is updated (tips)
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category, refetch]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.feed}>
        {Array.from({ length: 3 }).map((_, i) => (
          <ConfessionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <EmptyState
        icon="⚠️"
        title="Failed to load confessions"
        description="Something went wrong. Please try again."
        actionLabel="Retry"
        onAction={handleRefresh}
      />
    );
  }

  const allConfessions = data?.pages.flatMap((page) => page.confessions) ?? [];

  // Empty state
  if (allConfessions.length === 0) {
    return (
      <EmptyState
        icon="📭"
        title="No confessions yet"
        description={
          category
            ? `No ${category} confessions found. Be the first to share!`
            : 'Be the first to share a confession!'
        }
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Pull to refresh indicator */}
      <div className={styles.pullToRefresh} onClick={handleRefresh}>
        <span className={styles.refreshIcon}>↻</span>
        <span className={styles.refreshText}>Pull to refresh</span>
      </div>

      {/* Feed */}
      <div className={styles.feed}>
        {allConfessions.map((confession) => (
          <ConfessionCard
            key={confession.id}
            confession={confession}
            isOwn={userAddress === confession.author_address}
            onTip={onTip}
            onShare={onShare}
          />
        ))}

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className={styles.loadingMore}>
            <ConfessionCardSkeleton />
          </div>
        )}

        {/* Intersection observer target */}
        <div ref={observerTarget} className={styles.observerTarget} />

        {/* End of feed message */}
        {!hasNextPage && allConfessions.length > 0 && (
          <div className={styles.endMessage}>
            <span>You&apos;ve reached the end! 🎉</span>
          </div>
        )}
      </div>
    </div>
  );
};
