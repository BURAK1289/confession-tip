'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { ConfessionCardSkeleton, EmptyState } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useRealtimeAllTips } from '@/hooks';
import type { Confession } from '@/types';
import Link from 'next/link';
import styles from './page.module.css';

interface LeaderboardEntry extends Confession {
  rank: number;
}

const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const response = await fetch('/api/leaderboard');
  
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }

  const data = await response.json();
  return data.confessions.map((confession: Confession, index: number) => ({
    ...confession,
    rank: index + 1,
  }));
};

export default function LeaderboardPage() {
  const [selectedConfession, setSelectedConfession] = useState<Confession | null>(null);

  // Enable real-time tip updates for all confessions
  useRealtimeAllTips();

  const { data: leaderboard, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return styles.gold;
      case 2:
        return styles.silver;
      case 3:
        return styles.bronze;
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backButton}>
            ← Back
          </Link>
          <h1 className={styles.title}>🏆 Leaderboard</h1>
        </header>
        <div className={styles.content}>
          {Array.from({ length: 5 }).map((_, i) => (
            <ConfessionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !leaderboard) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backButton}>
            ← Back
          </Link>
          <h1 className={styles.title}>🏆 Leaderboard</h1>
        </header>
        <div className={styles.content}>
          <EmptyState
            icon="⚠️"
            title="Failed to load leaderboard"
            description="Please try again later"
          />
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backButton}>
            ← Back
          </Link>
          <h1 className={styles.title}>🏆 Leaderboard</h1>
        </header>
        <div className={styles.content}>
          <EmptyState
            icon="🏆"
            title="No confessions yet"
            description="Be the first to share and get tips!"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backButton}>
          ← Back
        </Link>
        <h1 className={styles.title}>🏆 Leaderboard</h1>
        <p className={styles.subtitle}>Top {leaderboard.length} confessions by tips</p>
      </header>

      <div className={styles.content}>
        <div className={styles.leaderboard}>
          {leaderboard.map((entry) => (
            <div
              key={entry.id}
              className={`${styles.entry} ${getRankClass(entry.rank)}`}
              onClick={() => setSelectedConfession(entry)}
            >
              {/* Rank */}
              <div className={styles.rankBadge}>
                {getRankEmoji(entry.rank)}
              </div>

              {/* Content */}
              <div className={styles.entryContent}>
                <div className={styles.entryHeader}>
                  <Badge category={entry.category} />
                  <span className={styles.timestamp}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className={styles.text}>{truncateText(entry.text)}</p>
              </div>

              {/* Stats */}
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>
                    ${entry.total_tips.toFixed(3)}
                  </span>
                  <span className={styles.statLabel}>USDC</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{entry.tip_count}</span>
                  <span className={styles.statLabel}>
                    {entry.tip_count === 1 ? 'tip' : 'tips'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Confession Modal */}
      {selectedConfession && (
        <Modal
          isOpen={!!selectedConfession}
          onClose={() => setSelectedConfession(null)}
          title="Full Confession"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <Badge category={selectedConfession.category} />
              <span className={styles.modalDate}>
                {new Date(selectedConfession.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className={styles.modalText}>{selectedConfession.text}</p>
            <div className={styles.modalStats}>
              <div className={styles.modalStatItem}>
                <span className={styles.modalStatIcon}>💰</span>
                <span>${selectedConfession.total_tips.toFixed(3)} USDC</span>
              </div>
              <div className={styles.modalStatItem}>
                <span className={styles.modalStatIcon}>🎁</span>
                <span>
                  {selectedConfession.tip_count}{' '}
                  {selectedConfession.tip_count === 1 ? 'tip' : 'tips'}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
