'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAccount } from 'wagmi';
import { WalletConnect } from '@/components/wallet';
import { NetworkWarning } from '@/components/wallet/NetworkWarning';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ConfessionFeed, CategoryFilter, CreateConfessionModal } from '@/components/confession';
import { useNetworkValidation } from '@/hooks/useNetworkValidation';
import { useRealtimeConfessions, useRealtimeTips, useRealtimeConnection } from '@/hooks';
import type { ConfessionCategory } from '@/types';
import styles from './page.module.css';

function HomeContent() {
  const { address } = useAccount();
  const { isCorrectNetwork } = useNetworkValidation();
  const [selectedCategory, setSelectedCategory] = useState<ConfessionCategory | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Enable real-time updates
  useRealtimeConfessions();
  useRealtimeTips();
  useRealtimeConnection();

  // Handle deep linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const confessionId = params.get('confession');
    
    if (confessionId) {
      window.location.href = `/confession/${confessionId}`;
    }
  }, []);

  const handleTip = async (confessionId: string, amount: number) => {
    console.log('Tipping confession:', confessionId, 'amount:', amount);
  };

  const handleShare = (confessionId: string) => {
    console.log('Sharing confession:', confessionId);
  };

  return (
    <div className={styles.container}>
      <ConnectionStatus />
      
      {address && !isCorrectNetwork && <NetworkWarning />}

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🤫</span>
            <h1 className={styles.logoText}>Confession Tip</h1>
          </div>
          <WalletConnect />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.heroSection}>
          <h2 className={styles.heroTitle}>Anonymous Confessions</h2>
          <p className={styles.heroSubtitle}>Share your secrets safely</p>
        </div>

        <div className={styles.filterSection}>
          <CategoryFilter
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>

        <ConfessionFeed
          category={selectedCategory}
          onTip={handleTip}
          onShare={handleShare}
          userAddress={address}
        />
      </main>

      <button
        className={styles.fab}
        onClick={() => {
          if (!address) {
            alert('Please connect your wallet first to share a confession');
            return;
          }
          setIsCreateModalOpen(true);
        }}
        aria-label="Create confession"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <CreateConfessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        walletAddress={address}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className={styles.container}>
      <div className={styles.loading}>Loading...</div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeContent />
    </Suspense>
  );
}
