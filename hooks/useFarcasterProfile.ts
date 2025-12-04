'use client';

import { useState, useEffect, useCallback } from 'react';

export interface FarcasterProfile {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  address: string;
}

interface CachedProfile extends FarcasterProfile {
  cachedAt: number;
}

interface UseFarcasterProfileResult {
  profile: FarcasterProfile | null;
  isLoading: boolean;
  error: Error | null;
}

const CACHE_KEY_PREFIX = 'fc_profile_';
const CACHE_DURATION = 3600000; // 1 hour in ms

// In-memory cache for current session
const profileCache = new Map<string, CachedProfile>();

// Default avatar for users without profile
const DEFAULT_AVATAR = 'https://warpcast.com/avatar.png';

export const useFarcasterProfile = (address?: string): UseFarcasterProfileResult => {
  const [profile, setProfile] = useState<FarcasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getCachedProfile = useCallback((addr: string): CachedProfile | null => {
    // Check memory cache first
    const memCached = profileCache.get(addr.toLowerCase());
    if (memCached && Date.now() - memCached.cachedAt < CACHE_DURATION) {
      return memCached;
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`${CACHE_KEY_PREFIX}${addr.toLowerCase()}`);
      if (stored) {
        const parsed = JSON.parse(stored) as CachedProfile;
        if (Date.now() - parsed.cachedAt < CACHE_DURATION) {
          profileCache.set(addr.toLowerCase(), parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    return null;
  }, []);

  const setCachedProfile = useCallback((addr: string, prof: FarcasterProfile) => {
    const cached: CachedProfile = {
      ...prof,
      cachedAt: Date.now(),
    };

    profileCache.set(addr.toLowerCase(), cached);

    try {
      localStorage.setItem(
        `${CACHE_KEY_PREFIX}${addr.toLowerCase()}`,
        JSON.stringify(cached)
      );
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cached = getCachedProfile(address);
      if (cached) {
        setProfile(cached);
        setIsLoading(false);
        return;
      }

      // Create fallback profile with shortened address
      // In production, you could call Farcaster API to get real profile
      try {
        const fallbackProfile: FarcasterProfile = {
          fid: 0,
          username: `${address.slice(0, 6)}...${address.slice(-4)}`,
          displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
          pfpUrl: DEFAULT_AVATAR,
          address: address,
        };
        
        setProfile(fallbackProfile);
        setCachedProfile(address, fallbackProfile);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [address, getCachedProfile, setCachedProfile]);

  return { profile, isLoading, error };
};

// Hook to get current user's profile from MiniKit context
export const useCurrentUserProfile = (): UseFarcasterProfileResult => {
  const [profile, setProfile] = useState<FarcasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const context = await sdk.context;
        
        if (context?.user) {
          setProfile({
            fid: context.user.fid,
            username: context.user.username || `fid:${context.user.fid}`,
            displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
            pfpUrl: context.user.pfpUrl || DEFAULT_AVATAR,
            address: '',
          });
        }
      } catch {
        // Not in MiniApp context - this is fine
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return {
    profile,
    isLoading,
    error: null,
  };
};

// Utility to format address for display
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
