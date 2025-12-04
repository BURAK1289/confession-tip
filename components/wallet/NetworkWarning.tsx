'use client';

import React, { useState } from 'react';
import { useNetworkValidation } from '@/hooks/useNetworkValidation';
import { Button } from '@/components/ui/Button';
import styles from './NetworkWarning.module.css';

export const NetworkWarning: React.FC = () => {
  const { isCorrectNetwork, switchToBase, requiredChain } = useNetworkValidation();
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isCorrectNetwork) {
    return null;
  }

  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    setError(null);
    
    const result = await switchToBase();
    
    if (!result.success) {
      setError(result.error || 'Failed to switch network');
    }
    
    setIsSwitching(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>⚠️</div>
        <div className={styles.message}>
          <h3 className={styles.title}>Wrong Network</h3>
          <p className={styles.description}>
            Please switch to {requiredChain.name} network to use this app.
          </p>
          {error && (
            <p className={styles.error}>{error}</p>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSwitchNetwork}
          isLoading={isSwitching}
          disabled={isSwitching}
        >
          Switch to {requiredChain.name}
        </Button>
      </div>
    </div>
  );
};
