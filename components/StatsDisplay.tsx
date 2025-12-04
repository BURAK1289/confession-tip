"use client";

import { useStats } from "@/hooks/useStats";
import styles from "./StatsDisplay.module.css";

interface StatsDisplayProps {
  compact?: boolean;
}

/**
 * Component to display public app statistics
 * Requirements: 14.4
 */
export function StatsDisplay({ compact = false }: StatsDisplayProps) {
  const { data: stats, isLoading, isError } = useStats();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading stats...</div>
      </div>
    );
  }

  if (isError || !stats) {
    return null; // Silently fail for stats
  }

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <span className={styles.compactStat}>
          📝 {stats.totalConfessions.toLocaleString()} confessions
        </span>
        <span className={styles.compactStat}>
          💰 ${stats.totalTipAmount.toFixed(2)} tipped
        </span>
        <span className={styles.compactStat}>
          👥 {stats.uniqueUsers.toLocaleString()} users
        </span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📊 Community Stats</h2>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📝</span>
          <span className={styles.statValue}>
            {stats.totalConfessions.toLocaleString()}
          </span>
          <span className={styles.statLabel}>Total Confessions</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon}>💰</span>
          <span className={styles.statValue}>
            ${stats.totalTipAmount.toFixed(2)}
          </span>
          <span className={styles.statLabel}>Total Tips (USDC)</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon}>🎁</span>
          <span className={styles.statValue}>
            {stats.totalTips.toLocaleString()}
          </span>
          <span className={styles.statLabel}>Tips Sent</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon}>👥</span>
          <span className={styles.statValue}>
            {stats.uniqueUsers.toLocaleString()}
          </span>
          <span className={styles.statLabel}>Unique Users</span>
        </div>
      </div>

      <div className={styles.todaySection}>
        <h3 className={styles.todayTitle}>Today</h3>
        <div className={styles.todayStats}>
          <span>
            {stats.today.confessions} new confessions
          </span>
          <span>•</span>
          <span>
            {stats.today.tips} tips (${stats.today.tipAmount.toFixed(2)})
          </span>
        </div>
      </div>

      <div className={styles.lastUpdated}>
        Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}
