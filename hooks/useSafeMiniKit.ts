'use client';

import { useState, useEffect } from 'react';

interface MiniKitContext {
  client?: unknown;
}

interface SafeMiniKitResult {
  context: MiniKitContext | null;
  isInMiniApp: boolean;
  isLoading: boolean;
}

/**
 * Safe wrapper for MiniKit that doesn't throw errors in local development
 * When running outside of Farcaster/MiniKit context, returns null context
 */
export function useSafeMiniKit(): SafeMiniKitResult {
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [context, setContext] = useState<MiniKitContext | null>(null);

  useEffect(() => {
    const checkMiniApp = async () => {
      try {
        // Check if we're in a Farcaster miniapp context
        // The miniapp-sdk provides context when running inside Farcaster
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        // Check if SDK is available and we're in miniapp context
        if (sdk && typeof sdk.isReady === 'function') {
          const ready = await sdk.isReady();
          if (ready) {
            setIsInMiniApp(true);
            setContext({ client: sdk });
          }
        }
      } catch {
        // Not in miniapp context - this is fine for local development
        console.log('Not running in MiniApp context (local development)');
      } finally {
        setIsLoading(false);
      }
    };

    checkMiniApp();
  }, []);

  return { context, isInMiniApp, isLoading };
}
