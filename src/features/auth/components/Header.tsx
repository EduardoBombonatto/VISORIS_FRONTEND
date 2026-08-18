'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const activeWorkspace = useAuthStore((state) => state.activeWorkspace);
  const logout = useAuthStore((state) => state.logout);

  const onSwitchClinic = () => {
    router.push('/workspace');
  };

  const onLogout = () => {
    logout();
    router.push('/auth?logout=1');
  };

  return (
    <header className={styles.header}>
      <div className={styles.info}>
        <span className={styles.doctorName}>{user?.fullName}</span>
        <span className={styles.clinicName}>{activeWorkspace?.name}</span>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.switch} onClick={onSwitchClinic}>
          Trocar Clínica
        </button>
        <button type="button" className={styles.logout} onClick={onLogout}>
          Sair
        </button>
      </div>
    </header>
  );
}
