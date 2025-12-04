'use client';

import React, { useState } from 'react';
import { Share2, DollarSign, Clock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TipButton } from '@/components/tip/TipButton';
import { useFarcasterShare } from '@/hooks/useFarcasterShare';
import { cn } from '@/lib/utils';
import type { Confession, ConfessionCategory } from '@/types';

export interface ConfessionCardProps {
  confession: Confession;
  isOwn?: boolean;
  onTip?: (confessionId: string, amount: number) => Promise<void>;
  onShare?: (confessionId: string) => void;
  className?: string;
}

const MAX_PREVIEW_LENGTH = 200;

const categoryEmojis: Record<ConfessionCategory, string> = {
  funny: '😂',
  deep: '🤔',
  relationship: '💕',
  work: '💼',
  random: '🎲',
  wholesome: '🥰',
  regret: '😔',
};

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
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
      "transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]",
      className
    )}>
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      {/* Subtle glow effects */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge category={confession.category}>
            <span className="mr-1">{categoryEmojis[confession.category]}</span>
            {confession.category}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{getRelativeTime(confession.created_at)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <p className="text-zinc-100 leading-relaxed text-[15px]">
            {displayText}
          </p>
          {needsExpansion && (
            <button
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="font-semibold text-zinc-200">${confession.total_tips.toFixed(3)}</span>
              <span className="hidden sm:inline">USDC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="font-semibold text-zinc-200">{confession.tip_count}</span>
              <span className="hidden sm:inline">{confession.tip_count === 1 ? 'tip' : 'tips'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-9 px-3 text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
              >
                <Share2 className="w-4 h-4 mr-1.5" />
                Share
              </Button>
            )}

            {!isOwn ? (
              <TipButton
                confessionId={confession.id}
                recipientAddress={confession.author_address}
                onTipSuccess={onTip ? () => onTip(confession.id, 0) : undefined}
              />
            ) : (
              <span className="text-xs text-zinc-500 font-medium px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                Your confession
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
    </div>
  );
};
