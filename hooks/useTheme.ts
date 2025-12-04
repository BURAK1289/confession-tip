"use client";

import { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "confession-tip-theme";

/**
 * Hook for managing theme (dark mode)
 * Requirements: 11.5
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Get system preference
  const getSystemTheme = useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  // Resolve theme to actual value
  const resolveTheme = useCallback(
    (t: Theme): "light" | "dark" => {
      if (t === "system") {
        return getSystemTheme();
      }
      return t;
    },
    [getSystemTheme]
  );

  // Apply theme to document
  const applyTheme = useCallback((resolved: "light" | "dark") => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    if (resolved === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }

    setResolvedTheme(resolved);
  }, []);

  // Set theme
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);

      // Save to localStorage
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      }

      // Apply theme
      applyTheme(resolveTheme(newTheme));
    },
    [applyTheme, resolveTheme]
  );

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Initialize theme on mount
  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Load saved theme
    let savedTheme: Theme | null = null;
    try {
      savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    } catch {
      // localStorage not available
    }
    const initialTheme = savedTheme || "system";

    setThemeState(initialTheme);
    applyTheme(resolveTheme(initialTheme));

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [applyTheme, getSystemTheme, resolveTheme, theme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === "dark",
  };
}
