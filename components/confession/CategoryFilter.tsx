'use client';

import React from 'react';
import type { ConfessionCategory } from '@/types';
import {
  AllIcon,
  FunnyIcon,
  DeepIcon,
  LoveIcon,
  WorkIcon,
  RandomIcon,
  WholesomeIcon,
  RegretIcon,
} from './CategoryIcons';
import styles from './CategoryFilter.module.css';

export interface CategoryFilterProps {
  selected: ConfessionCategory | null;
  onChange: (category: ConfessionCategory | null) => void;
  className?: string;
}

const categories: {
  value: ConfessionCategory;
  label: string;
  Icon: React.FC<{ className?: string; size?: number }>;
}[] = [
  { value: 'funny', label: 'Funny', Icon: FunnyIcon },
  { value: 'deep', label: 'Deep', Icon: DeepIcon },
  { value: 'relationship', label: 'Love', Icon: LoveIcon },
  { value: 'work', label: 'Work', Icon: WorkIcon },
  { value: 'random', label: 'Random', Icon: RandomIcon },
  { value: 'wholesome', label: 'Wholesome', Icon: WholesomeIcon },
  { value: 'regret', label: 'Regret', Icon: RegretIcon },
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
          <AllIcon className={styles.icon} size={14} />
          <span className={styles.label}>All</span>
        </button>

        {/* Category buttons */}
        {categories.map((category) => (
          <button
            key={category.value}
            className={`${styles.pill} ${selected === category.value ? styles.active : ''}`}
            onClick={() => onChange(category.value)}
          >
            <category.Icon className={styles.icon} size={14} />
            <span className={styles.label}>{category.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
