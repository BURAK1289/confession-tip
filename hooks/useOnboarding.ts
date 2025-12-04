'use client';

import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'confession_tip_onboarding_completed';

interface UseOnboardingResult {
  showOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  isLoading: boolean;
}

export const useOnboarding = (): UseOnboardingResult => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const hasCompleted = localStorage.getItem(ONBOARDING_KEY);
    
    if (!hasCompleted) {
      setShowOnboarding(true);
    }
    
    setIsLoading(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  }, []);

  return {
    showOnboarding,
    completeOnboarding,
    resetOnboarding,
    isLoading,
  };
};
