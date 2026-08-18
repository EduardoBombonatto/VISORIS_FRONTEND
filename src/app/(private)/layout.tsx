'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/auth-store';
import { useAuthSelectWorkspace } from '@/api/auth/auth';
import type { AuthSelectWorkspace200 } from '@/api/index.schemas';
import { fetchSession } from '@/features/auth/api/session';
import { resolvePostAuthRoute } from '@/features/auth/utils/route-guard';
import AppShell from '@/features/auth/components/AppShell';
import styles from './layout.module.css';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const workspaces = useAuthStore((state) => state.workspaces);
  const activeWorkspace = useAuthStore((state) => state.activeWorkspace);
  const setSession = useAuthStore((state) => state.setSession);
  const setActiveWorkspace = useAuthStore((state) => state.setActiveWorkspace);

  const restoreAttempted = useRef(false);
  const autoSelectFired = useRef<string | null>(null);

  const selectMutation = useAuthSelectWorkspace({
    mutation: {
      onSuccess: (result) => {
        const envelope = result.data as AuthSelectWorkspace200;
        setActiveWorkspace(envelope.data.activeWorkspace);
        router.replace('/dashboard');
      },
      onError: () => {
        router.replace('/auth');
      },
    },
  });

  useEffect(() => {
    if (user) return;
    if (restoreAttempted.current) return;
    restoreAttempted.current = true;

    fetchSession()
      .then((envelope) => {
        setSession(envelope.data.user, envelope.data.workspaces);
      })
      .catch(() => {
        router.replace('/auth');
      });
  }, [user, setSession, router]);

  useEffect(() => {
    if (!user) return;

    const action = resolvePostAuthRoute({ pathname, workspaces, activeWorkspace });

    if (action.type === 'redirect') {
      router.replace(action.to);
    } else if (action.type === 'auto-select') {
      if (autoSelectFired.current !== action.clinicId) {
        autoSelectFired.current = action.clinicId;
        selectMutation.mutate({ data: { clinicId: action.clinicId } });
      }
    }
  }, [user, pathname, workspaces, activeWorkspace, router, selectMutation]);

  if (!user) {
    return (
      <div className={styles.loading} role="status" aria-label="Carregando">
        <Spinner />
      </div>
    );
  }

  const action = resolvePostAuthRoute({ pathname, workspaces, activeWorkspace });

  if (action.type !== 'render') {
    return (
      <div className={styles.loading} role="status" aria-label="Carregando">
        <Spinner />
      </div>
    );
  }

  if (pathname === '/dashboard') {
    return <AppShell>{children}</AppShell>;
  }

  return <>{children}</>;
}
