'use client';

import Sidebar from './Sidebar';
import Header from './Header';
import styles from './AppShell.module.css';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.content}>
        <Header />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
