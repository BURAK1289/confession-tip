'use client';

import React from 'react';
import type { ConfessionCategory } from '@/types';
import styles from './CategoryFilter.module.css';

export interface CategoryFilterProps {
  selected: ConfessionCategory | null;
  onChange: (category: ConfessionCategory | null) => void;
  className?: string;
}

const categories: { value: ConfessionCategory; label: string; emoji: string }[] = [
  { value: 'funny', label: 'Funny', emoji: '😂' },
  { value: 'deep', label: 'Deep', emoji: '🤔' },
  { value: 'relationship', label: 'Love', emoji: '💕' },
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'random', label: 'Random', emoji: '🎲' },
  { value: 'wholesome', label: 'Wholesome', emoji: '🥰' },
  { value: 'regret', label: 'Regret', emoji: '😔' },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selected,
  onChange,
  className = '',
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.scrollContainer}>
        {/* All button */}
        <button
          className={`${styles.pill} ${!selected ? styles.active : ''}`}
          onClick={() => onChange(null)}
        >
          <span className={styles.emoji}>✨</span>
          <span className={styles.label}>All</span>
        </button>

        {/* Category buttons */}
        {categories.map((category) => (
          <button
            key={category.value}
            className={`${styles.pill} ${selected === category.value ? styles.active : ''}`}
            onClick={() => onChange(category.value)}
          >
            <span className={styles.emoji}>{category.emoji}</span>
            <span className={styles.label}>{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
