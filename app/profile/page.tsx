'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui';
import { WalletConnect } from '@/components/wallet';
import { useToast } from '@/components/ui/Toast';
import { useRealtimeUserTips } from '@/hooks';
import type { Confession } from '@/types';
import styles from './page.module.css';

interface UserProfile {
  address: string;
  totalConfessions: number;
  totalTipsReceived: number;
  totalTipsGiven: number;
  referralCode: string;
  referralCount: number;
  confessions: Confession[];
}

const fetchProfile = async (address: string): Promise<UserProfile> => {
  const response = await fetch(`/api/profile?address=${address}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  const data = await response.json();
  
  // Transform API response to match frontend interface
  return {
    address: data.user?.address || address,
    totalConfessions: data.user?.total_confessions || 0,
    totalTipsReceived: data.user?.total_tips_received || 0,
    totalTipsGiven: data.user?.total_tips_given || 0,
    referralCode: data.user?.referral_code || '',
    referralCount: data.user?.referral_count || 0,
    confessions: data.confessions || [],
  };
};

export default function ProfilePage() {
  const { address } = useAccount();
  const { showToast } = useToast();
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Enable real-time tip updates for this user
  useRealtimeUserTips({ userAddress: address });

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile', address],
    queryFn: () => fetchProfile(address!),
    enabled: !!address,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleCopyReferral = async () => {
    if (!profile) return;

    const referralLink = `${window.location.origin}?ref=${profile.referralCode}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedReferral(true);
      showToast('Referral link copied!', 'success');
      
      setTimeout(() => setCopiedReferral(false), 2000);
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  if (!address) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>👤 Profile</h1>
        </header>
        <div className={styles.content}>
          <div className={styles.connectWallet}>
            <EmptyState
              icon="🔐"
              title="Connect your wallet"
              description="Connect your wallet to view your profile"
            />
            <div className={styles.walletButton}>
              <WalletConnect />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>👤 Profile</h1>
        </header>
        <div className={styles.content}>
          <div className={styles.statsGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.statCard}>
                <div className={styles.statSkeleton} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>👤 Profile</h1>
        </header>
        <div className={styles.content}>
          <EmptyState
            icon="⚠️"
            title="Failed to load profile"
            description="Please try again later"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>👤 Profile</h1>
      </header>

      <div className={styles.content}>
        {/* Wallet Address */}
        <div className={styles.addressCard}>
          <span className={styles.addressLabel}>Wallet Address</span>
          <span className={styles.address}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📝</span>
            <span className={styles.statValue}>{profile.totalConfessions}</span>
            <span className={styles.statLabel}>Confessions</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>💰</span>
            <span className={styles.statValue}>
              ${profile.totalTipsReceived.toFixed(3)}
            </span>
            <span className={styles.statLabel}>Tips Received</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🎁</span>
            <span className={styles.statValue}>
              ${profile.totalTipsGiven.toFixed(3)}
            </span>
            <span className={styles.statLabel}>Tips Given</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👥</span>
            <span className={styles.statValue}>{profile.referralCount}</span>
            <span className={styles.statLabel}>Referrals</span>
          </div>
        </div>

        {/* Referral Section */}
        <div className={styles.referralSection}>
          <h2 className={styles.sectionTitle}>🎉 Invite Friends</h2>
          <p className={styles.referralDescription}>
            Share your referral link and earn 0.01 USDC for each friend who joins!
          </p>
          <div className={styles.referralCard}>
            <div className={styles.referralCode}>
              <span className={styles.referralLabel}>Your Code:</span>
              <span className={styles.code}>{profile.referralCode}</span>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleCopyReferral}
            >
              {copiedReferral ? '✓ Copied!' : '📋 Copy Link'}
            </Button>
          </div>
        </div>

        {/* My Confessions */}
        <div className={styles.confessionsSection}>
          <h2 className={styles.sectionTitle}>📝 My Confessions</h2>
          {profile.confessions.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No confessions yet"
              description="Share your first confession to get started!"
            />
          ) : (
            <div className={styles.confessionsList}>
              {profile.confessions.map((confession) => (
                <div key={confession.id} className={styles.confessionItem}>
                  <div className={styles.confessionHeader}>
                    <Badge category={confession.category} />
                    <span className={styles.confessionDate}>
                      {new Date(confession.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={styles.confessionText}>{confession.text}</p>
                  <div className={styles.confessionStats}>
                    <div className={styles.confessionStat}>
                      <span className={styles.confessionStatIcon}>💰</span>
                      <span>${confession.total_tips.toFixed(3)} USDC</span>
                    </div>
                    <div className={styles.confessionStat}>
                      <span className={styles.confessionStatIcon}>🎁</span>
                      <span>
                        {confession.tip_count}{' '}
                        {confession.tip_count === 1 ? 'tip' : 'tips'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
