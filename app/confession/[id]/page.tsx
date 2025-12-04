'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfessionCard } from '@/components/confession/ConfessionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import type { Confession } from '@/types';
import styles from './page.module.css';

interface ConfessionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Helper to unwrap params
async function getParams(params: Promise<{ id: string }>) {
  return await params;
}

export default function ConfessionDetailPage({ params }: ConfessionDetailPageProps) {
  const router = useRouter();
  const [confession, setConfession] = useState<Confession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confessionId, setConfessionId] = useState<string | null>(null);

  useEffect(() => {
    getParams(params).then(p => setConfessionId(p.id));
  }, [params]);

  useEffect(() => {
    if (!confessionId) return;

    const fetchConfession = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/confessions/${confessionId}`);
        
        if (!response.ok) {
          throw new Error('Confession not found');
        }

        const data = await response.json();
        setConfession(data.confession);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load confession');
      } finally {
        setLoading(false);
      }
    };

    fetchConfession();
  }, [confessionId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Button variant="ghost" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>
        <Skeleton height={200} />
      </div>
    );
  }

  if (error || !confession) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Button variant="ghost" onClick={() => router.push('/')}>
            ← Home
          </Button>
        </div>
        <div className={styles.error}>
          <h2>Confession Not Found</h2>
          <p>{error || 'This confession may have been deleted.'}</p>
          <Button onClick={() => router.push('/')}>
            Go to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>
      
      <div className={styles.content}>
        <ConfessionCard
          confession={confession}
          onShare={(id) => console.log('Shared:', id)}
        />
      </div>
    </div>
  );
}
