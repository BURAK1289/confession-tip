'use client';

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Fermuarlı ağız - Confession teması için ana ikon
export const ZipperMouthIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="8" cy="10" r="1.5" fill="currentColor" />
    <circle cx="16" cy="10" r="1.5" fill="currentColor" />
    <path
      d="M7 15h10M9 15v2M11 15v2M13 15v2M15 15v2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Funny - Gülen yüz
export const FunnyIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 9v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 9v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M8 14c0 2.5 2 4 4 4s4-1.5 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Deep - Düşünen beyin/zihin
export const DeepIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="13" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path
      d="M9 11c0-1.5 1.5-3 3-3s3 1.5 3 3c0 1-0.5 1.5-1 2s-1 1-1 2v1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="12" cy="18" r="0.5" fill="currentColor" />
    <path d="M5 6l2 2M19 6l-2 2M12 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Love/Relationship - Kalp
export const LoveIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 21C12 21 4 15 4 9.5C4 6.5 6.5 4 9.5 4C11 4 12 5 12 5C12 5 13 4 14.5 4C17.5 4 20 6.5 20 9.5C20 15 12 21 12 21Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 8C12 8 10 6 8.5 7C7 8 7 10 8.5 11.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Work - Evrak çantası
export const WorkIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 7V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 11v4M10 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Random - Zar
export const RandomIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="16" cy="8" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="8" cy="16" r="1.5" fill="currentColor" />
    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
  </svg>
);

// Wholesome - Güneş/Sıcaklık
export const WholesomeIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Regret - Gözyaşı
export const RegretIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 9v1M16 9v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 16c1.5-1.5 3-2 4-2s2.5.5 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 12c0 1.5-1 3-1 3s-1-1.5-1-3c0-1 .5-1.5 1-1.5s1 .5 1 1.5z" fill="currentColor" opacity="0.6" />
  </svg>
);

// All - Yıldız/Sparkle
export const AllIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M5 16l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

// Icon map for easy access
export const CategoryIconMap = {
  all: AllIcon,
  funny: FunnyIcon,
  deep: DeepIcon,
  relationship: LoveIcon,
  work: WorkIcon,
  random: RandomIcon,
  wholesome: WholesomeIcon,
  regret: RegretIcon,
} as const;
