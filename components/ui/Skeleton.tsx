import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'text',
  className = '',
}) => {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const skeletonClass = [
    styles.skeleton,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={skeletonClass} style={style} />;
};

// Confession Card Skeleton
export const ConfessionCardSkeleton: React.FC = () => {
  return (
    <div className={styles.cardSkeleton}>
      <div className={styles.header}>
        <Skeleton variant="rectangular" width={80} height={24} />
        <Skeleton variant="text" width={60} height={16} />
      </div>
      <div className={styles.content}>
        <Skeleton variant="text" width="100%" height={16} />
        <Skeleton variant="text" width="95%" height={16} />
        <Skeleton variant="text" width="80%" height={16} />
      </div>
      <div className={styles.footer}>
        <div className={styles.stats}>
          <Skeleton variant="text" width={80} height={16} />
          <Skeleton variant="text" width={60} height={16} />
        </div>
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
};
