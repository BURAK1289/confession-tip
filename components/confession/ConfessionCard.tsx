'use client';

import React, { useState } from 'react';
import { Share2, Clock, DollarSign, Tag } from 'lucide-react';
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
  hasTipped?: boolean;
}

const MAX_PREVIEW_LENGTH = 200;

export const ConfessionCard: React.FC<ConfessionCardProps> = ({
  confession,
  isOwn = false,
  onTip,
  onShare,
  className = '',
  hasTipped = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareCount, setShareCount] = useState(0);
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
    setShareCount(prev => prev + 1);
    if (onShare) {
      onShare(confession.id);
    }
  };

  return (
    <div className={`${styles.card} ${className}`}>
      {/* Gradient overlay */}
      <div className={styles.gradientOverlay} />
      
      {/* Top right glow */}
      <div className={styles.glowTopRight} />
      
      {/* Bottom left glow */}
      <div className={styles.glowBottomLeft} />
      
      {/* Content */}
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.badge}>
            <Tag className={styles.badgeIcon} />
            {confession.category.charAt(0).toUpperCase() + confession.category.slice(1)}
          </span>
          <div className={styles.timestamp}>
            <Clock className={styles.timestampIcon} />
            <span>{getRelativeTime(confession.created_at)}</span>
          </div>
        </div>

        {/* Text */}
        <div className={styles.textWrapper}>
          <p className={styles.text}>{displayText}</p>
          {needsExpansion && (
            <button
              className={styles.expandBtn}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <DollarSign className={styles.statIcon} />
              <span className={styles.statValue}>{confession.tip_count}</span>
              <span className={styles.statLabel}>tips</span>
            </div>
            <div className={styles.statItem}>
              <Share2 className={styles.statIcon} />
              <span className={styles.statValue}>{shareCount}</span>
              <span className={styles.statLabel}>shares</span>
            </div>
          </div>

          <div className={styles.actions}>
            <button onClick={handleShare} className={styles.shareBtn}>
              <Share2 className={styles.actionIcon} />
              Share
            </button>
            
            {!isOwn ? (
              <TipButton
                confessionId={confession.id}
                recipientAddress={confession.author_address}
                onTipSuccess={onTip ? () => onTip(confession.id, 0) : undefined}
                hasTipped={hasTipped}
              />
            ) : (
              <span className={styles.ownBadge}>Your confession</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className={styles.bottomGlow} />
    </div>
  );
};
