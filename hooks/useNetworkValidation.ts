'use client';

import { useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

export const useNetworkValidation = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isCorrectNetwork = chainId === base.id;
  const isBaseNetwork = isCorrectNetwork;

  useEffect(() => {
    if (isConnected && !isCorrectNetwork) {
      console.warn('Wrong network detected. Expected Base (8453), got:', chainId);
    }
  }, [isConnected, isCorrectNetwork, chainId]);

  const switchToBase = async () => {
    try {
      await switchChain({ chainId: base.id });
      return { success: true };
    } catch (error) {
      console.error('Failed to switch network:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to switch network' 
      };
    }
  };

  return {
    isCorrectNetwork,
    isBaseNetwork,
    switchToBase,
    requiredChain: base,
    currentChainId: chainId,
  };
};
