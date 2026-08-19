'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/ui/Alert';
import { useAuthLogout } from '@/api/auth/auth';
import { useAuthStore } from '@/store/auth-store';
import { clearSessionCookie } from '@/lib/session-cookie';
import { ApiError } from '@/lib/axios';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const activeWorkspace = useAuthStore((state) => state.activeWorkspace);
  const logout = useAuthStore((state) => state.logout);
  const [error, setError] = useState<string | null>(null);

  const mutation = useAuthLogout<ApiError>({
    mutation: {
      onSuccess: () => {
        logout();
        clearSessionCookie();
        router.push('/auth');
      },
      onError: (logoutError) => {
        setError(logoutError.message);
      },
    },
  });

  const onSwitchClinic = () => {
    router.push('/workspace');
  };

  const onLogout = () => {
    setError(null);
    mutation.mutate();
  };

  return (
    <header className={styles.header}>
      <div className={styles.info}>
        <span className={styles.doctorName}>{user?.fullName}</span>
        <span className={styles.clinicName}>{activeWorkspace?.name}</span>
      </div>
      <div className={styles.actions}>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <button type="button" className={styles.switch} onClick={onSwitchClinic}>
          Trocar Clínica
        </button>
        <button
          type="button"
          className={styles.logout}
          onClick={onLogout}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </header>
  );
}
