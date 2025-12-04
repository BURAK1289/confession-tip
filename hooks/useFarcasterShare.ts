'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { trackShare } from '@/lib/analytics';
import { useSafeMiniKit } from './useSafeMiniKit';
import type { Confession } from '@/types';

export const useFarcasterShare = () => {
  const { isInMiniApp } = useSafeMiniKit();
  const { showToast } = useToast();

  const truncateText = (text: string, maxLength: number = 280): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  };

  const generateShareUrl = (confessionId: string): string => {
    const baseUrl =
      process.env.NEXT_PUBLIC_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    return `${baseUrl}/confession/${confessionId}`;
  };

  const shareConfession = useCallback(
    async (confession: Confession) => {
      try {
        const truncatedText = truncateText(confession.text, 200);
        const shareUrl = generateShareUrl(confession.id);

        // Build share text
        const shareText = `🤫 Anonymous Confession:\n\n"${truncatedText}"\n\nTip this confession on Confession Tip!`;

        // Track share event
        trackShare({
          confessionId: confession.id,
          category: confession.category,
          timestamp: new Date().toISOString(),
        });

        // Try Farcaster SDK first (if in MiniApp)
        if (isInMiniApp) {
          try {
            const { sdk } = await import('@farcaster/miniapp-sdk');

            // Use composeCast to open Farcaster compose dialog
            await sdk.actions.composeCast({
              text: shareText,
              embeds: [shareUrl],
            });

            showToast('Shared!', 'success');
            return { success: true };
          } catch (sdkError) {
            console.warn('Farcaster SDK composeCast failed:', sdkError);
            // Fall through to other methods
          }
        }

        // Try Web Share API (mobile browsers)
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Anonymous Confession',
              text: shareText,
              url: shareUrl,
            });
            showToast('Shared successfully!', 'success');
            return { success: true };
          } catch (shareError) {
            // User cancelled or share failed
            if ((shareError as Error).name !== 'AbortError') {
              console.warn('Web Share API failed:', shareError);
            }
          }
        }

        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        showToast('Share text copied!', 'success');

        return { success: true };
      } catch (error) {
        console.error('Share failed:', error);
        showToast('Failed to share confession', 'error');
        return { success: false, error };
      }
    },
    [isInMiniApp, showToast]
  );

  const generateOpenGraphMetadata = (confession: Confession) => {
    const truncatedText = truncateText(confession.text, 200);

    return {
      title: `Anonymous Confession - ${confession.category}`,
      description: truncatedText,
      image: `${process.env.NEXT_PUBLIC_URL || ''}/api/og?id=${confession.id}`,
      url: generateShareUrl(confession.id),
    };
  };

  return {
    shareConfession,
    generateShareUrl,
    generateOpenGraphMetadata,
    truncateText,
    isInMiniApp,
  };
};
