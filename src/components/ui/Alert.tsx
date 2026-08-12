import type { ReactNode } from 'react';
import styles from './Alert.module.css';

interface AlertProps {
  variant?: 'error' | 'success';
  children: ReactNode;
}

export default function Alert({ variant = 'error', children }: AlertProps) {
  return (
    <div
      className={`${styles.alert} ${variant === 'error' ? styles.error : styles.success}`}
      role="alert"
    >
      {children}
    </div>
  );
}
