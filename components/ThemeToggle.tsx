"use client";

import { useTheme } from "@/hooks/useTheme";
import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
  showLabel?: boolean;
}

/**
 * Theme Toggle Component
 * Requirements: 11.5
 */
export function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={styles.container}>
      {showLabel && (
        <span className={styles.label}>Theme</span>
      )}
      
      <div className={styles.toggleGroup}>
        <button
          className={`${styles.option} ${theme === "light" ? styles.active : ""}`}
          onClick={() => setTheme("light")}
          aria-label="Light mode"
          title="Light mode"
        >
          ☀️
        </button>
        <button
          className={`${styles.option} ${theme === "system" ? styles.active : ""}`}
          onClick={() => setTheme("system")}
          aria-label="System preference"
          title="System preference"
        >
          💻
        </button>
        <button
          className={`${styles.option} ${theme === "dark" ? styles.active : ""}`}
          onClick={() => setTheme("dark")}
          aria-label="Dark mode"
          title="Dark mode"
        >
          🌙
        </button>
      </div>
    </div>
  );
}

/**
 * Simple theme toggle button
 */
export function ThemeToggleButton() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      className={styles.toggleButton}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
