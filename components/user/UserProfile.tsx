'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useFarcasterProfile, formatAddress } from '@/hooks';
import type { FarcasterProfile } from '@/hooks';
import styles from './UserProfile.module.css';

export interface UserProfileProps {
  address?: string;
  profile?: FarcasterProfile;
  showAvatar?: boolean;
  showUsername?: boolean;
  showAddress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  address,
  profile: providedProfile,
  showAvatar = true,
  showUsername = true,
  showAddress = false,
  size = 'md',
  className = '',
}) => {
  const { profile: fetchedProfile, isLoading } = useFarcasterProfile(
    providedProfile ? undefined : address
  );
  const [imgError, setImgError] = useState(false);

  const profile = providedProfile || fetchedProfile;

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className}`}>
        {showAvatar && (
          <div
            className={`${styles.skeleton} ${styles.skeletonAvatar} ${styles[`avatar${size.charAt(0).toUpperCase() + size.slice(1)}`]}`}
          />
        )}
        {showUsername && (
          <div className={`${styles.skeleton} ${styles.skeletonText}`} />
        )}
      </div>
    );
  }

  if (!profile && !address) {
    return null;
  }

  const displayName = profile?.displayName || profile?.username || formatAddress(address || '');
  const avatarUrl = profile?.pfpUrl;
  const initials = displayName.slice(0, 2).toUpperCase();

  const sizeClass = size.charAt(0).toUpperCase() + size.slice(1);

  const avatarSizes = { sm: 24, md: 32, lg: 40 };
  const avatarSize = avatarSizes[size];

  return (
    <div className={`${styles.container} ${className}`}>
      {showAvatar && (
        avatarUrl && !imgError ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={avatarSize}
            height={avatarSize}
            className={`${styles.avatar} ${styles[`avatar${sizeClass}`]}`}
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className={`${styles.avatarFallback} ${styles[`avatarFallback${sizeClass}`]}`}>
            {initials}
          </div>
        )
      )}
      
      {(showUsername || showAddress) && (
        <div className={styles.info}>
          {showUsername && (
            <span className={`${styles.username} ${styles[`username${sizeClass}`]}`}>
              {displayName}
            </span>
          )}
          {showAddress && address && (
            <span className={styles.address}>
              {formatAddress(address)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Simple avatar-only component
export const UserAvatar: React.FC<{
  address?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ address, size = 'md', className }) => (
  <UserProfile
    address={address}
    showAvatar={true}
    showUsername={false}
    size={size}
    className={className}
  />
);
