"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import styles from "./ConnectionStatus.module.css";

interface ConnectionStatusProps {
  showWhenConnected?: boolean;
}

/**
 * Component to display network and realtime connection status
 */
export function ConnectionStatus({
  showWhenConnected = false,
}: ConnectionStatusProps) {
  const { isOnline, isRealtimeConnected, reconnecting, reconnect } =
    useNetworkStatus();

  // Don't show anything if connected and showWhenConnected is false
  if (isOnline && isRealtimeConnected && !showWhenConnected) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className={`${styles.statusBar} ${styles.offline}`}>
        <span className={styles.icon}>📡</span>
        <span className={styles.text}>You&apos;re offline</span>
        <span className={styles.subtext}>
          Changes will sync when you&apos;re back online
        </span>
      </div>
    );
  }

  if (reconnecting) {
    return (
      <div className={`${styles.statusBar} ${styles.reconnecting}`}>
        <span className={styles.icon}>🔄</span>
        <span className={styles.text}>Reconnecting...</span>
      </div>
    );
  }

  if (!isRealtimeConnected) {
    return (
      <div className={`${styles.statusBar} ${styles.disconnected}`}>
        <span className={styles.icon}>⚠️</span>
        <span className={styles.text}>Real-time updates paused</span>
        <button className={styles.reconnectButton} onClick={reconnect}>
          Reconnect
        </button>
      </div>
    );
  }

  if (showWhenConnected) {
    return (
      <div className={`${styles.statusBar} ${styles.connected}`}>
        <span className={styles.icon}>✓</span>
        <span className={styles.text}>Connected</span>
      </div>
    );
  }

  return null;
}
