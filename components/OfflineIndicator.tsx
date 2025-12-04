"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import styles from "./OfflineIndicator.module.css";

/**
 * Offline Indicator Component
 * Requirements: 13.5
 */
export function OfflineIndicator() {
  const { isOnline, reconnecting, reconnect } = useNetworkStatus();

  if (isOnline && !reconnecting) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.indicator} ${reconnecting ? styles.reconnecting : styles.offline}`}>
        <span className={styles.icon}>
          {reconnecting ? "🔄" : "📡"}
        </span>
        <span className={styles.text}>
          {reconnecting ? "Reconnecting..." : "You're offline"}
        </span>
        {!reconnecting && (
          <button className={styles.retryButton} onClick={reconnect}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
