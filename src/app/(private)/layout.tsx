'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/auth-store';
import { fetchSession } from '@/features/auth/api/session';
import { clearSessionCookie } from '@/lib/session-cookie';
import AppShell from '@/features/auth/components/AppShell';
import styles from './layout.module.css';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);

  const restoreAttempted = useRef(false);

  useEffect(() => {
    if (user) return;
    if (restoreAttempted.current) return;
    restoreAttempted.current = true;

    fetchSession()
      .then((envelope) => {
        setSession(envelope.data.user);
      })
      .catch(() => {
        clearSessionCookie();
        router.replace('/auth');
      });
  }, [user, setSession, router]);

  if (!user) {
    return (
      <div className={styles.loading} role="status" aria-label="Carregando">
        <Spinner />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
