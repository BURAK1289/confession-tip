'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, User } from 'lucide-react';
import styles from './BottomNavigation.module.css';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    icon: <Home />,
    label: 'Home',
    href: '/',
  },
  {
    icon: <Trophy />,
    label: 'Leaderboard',
    href: '/leaderboard',
  },
  {
    icon: <User />,
    label: 'Profile',
    href: '/profile',
  },
];

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <div className={styles.navContent}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
