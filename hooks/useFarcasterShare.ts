'use client';

import { useToast } from '@/components/ui/Toast';
import { trackShare } from '@/lib/analytics';
import { useSafeMiniKit } from './useSafeMiniKit';
import type { Confession } from '@/types';

export const useFarcasterShare = () => {
  const { context, isInMiniApp } = useSafeMiniKit();
  const { showToast } = useToast();

  const truncateText = (text: string, maxLength: number = 280): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  };

  const generateShareUrl = (confessionId: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${baseUrl}?confession=${confessionId}`;
  };

  const shareConfession = async (confession: Confession) => {
    try {
      // Truncate confession text to 280 characters for Farcaster
      const truncatedText = truncateText(confession.text, 280);
      const shareUrl = generateShareUrl(confession.id);

      // Build share text
      const shareText = `${truncatedText}\n\n🤫 Share your confession anonymously on Confession Tip!\n${shareUrl}`;

      // Track share event
      trackShare({
        confessionId: confession.id,
        category: confession.category,
        timestamp: new Date().toISOString(),
      });

      // Check if MiniKit is available (running in Farcaster)
      if (isInMiniApp && context?.client) {
        // Use MiniKit SDK to open Farcaster compose dialog
        showToast('Opening Farcaster...', 'info');
        
        // For now, copy to clipboard as fallback
        await navigator.clipboard.writeText(shareText);
        showToast('Share text copied! Paste in Farcaster.', 'success');
      } else {
        // Fallback: Copy to clipboard (local development or non-Farcaster browser)
        await navigator.clipboard.writeText(shareText);
        showToast('Share text copied to clipboard!', 'success');
      }

      return { success: true };
    } catch (error) {
      console.error('Share failed:', error);
      showToast('Failed to share confession', 'error');
      return { success: false, error };
    }
  };

  const generateOpenGraphMetadata = (confession: Confession) => {
    const truncatedText = truncateText(confession.text, 200);
    
    return {
      title: `Anonymous Confession - ${confession.category}`,
      description: truncatedText,
      image: `${process.env.NEXT_PUBLIC_URL || ''}/og-image.png`,
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
