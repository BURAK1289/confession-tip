'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TipButton } from '@/components/tip/TipButton';
import { useFarcasterShare } from '@/hooks/useFarcasterShare';
import type { Confession } from '@/types';
import styles from './ConfessionCard.module.css';

export interface ConfessionCardProps {
  confession: Confession;
  isOwn?: boolean;
  onTip?: (confessionId: string, amount: number) => Promise<void>;
  onShare?: (confessionId: string) => void;
  className?: string;
}

const MAX_PREVIEW_LENGTH = 200;

export const ConfessionCard: React.FC<ConfessionCardProps> = ({
  confession,
  isOwn = false,
  onTip,
  onShare,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { shareConfession } = useFarcasterShare();

  const needsExpansion = confession.text.length > MAX_PREVIEW_LENGTH;
  const displayText = needsExpansion && !isExpanded
    ? `${confession.text.slice(0, MAX_PREVIEW_LENGTH)}...`
    : confession.text;

  const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  const handleShare = async () => {
    await shareConfession(confession);
    
    if (onShare) {
      onShare(confession.id);
    }
  };

  return (
    <div className={`${styles.card} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <Badge category={confession.category} />
        <span className={styles.timestamp}>
          {getRelativeTime(confession.created_at)}
        </span>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <p className={styles.text}>{displayText}</p>
        {needsExpansion && (
          <button
            className={styles.expandButton}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {/* Tip Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>💰</span>
            <span className={styles.statValue}>
              ${confession.total_tips.toFixed(3)} USDC
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>🎁</span>
            <span className={styles.statValue}>
              {confession.tip_count} {confession.tip_count === 1 ? 'tip' : 'tips'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Share Button */}
          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className={styles.actionButton}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="4" cy="8" r="2" />
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="11" r="2" />
                <line x1="5.5" y1="7" x2="10.5" y2="5.5" />
                <line x1="5.5" y1="9" x2="10.5" y2="10.5" />
              </svg>
              Share
            </Button>
          )}

          {/* Tip Button */}
          {!isOwn && (
            <TipButton
              confessionId={confession.id}
              recipientAddress={confession.author_address}
              onTipSuccess={onTip ? () => onTip(confession.id, 0) : undefined}
            />
          )}

          {isOwn && (
            <span className={styles.ownBadge}>Your confession</span>
          )}
        </div>
      </div>
    </div>
  );
};
