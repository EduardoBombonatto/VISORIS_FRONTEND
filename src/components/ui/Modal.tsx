'use client';

import { useId, type ReactNode } from 'react';
import NativeDialog from './NativeDialog';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  dismissible?: boolean;
}

export default function Modal({
  open,
  title,
  onClose,
  children,
  size = 'md',
  className = '',
  dismissible = true,
}: ModalProps) {
  const titleId = useId();

  return (
    <NativeDialog
      open={open}
      onClose={onClose}
      dismissible={dismissible}
      ariaLabelledBy={titleId}
      className={`${styles.dialog} ${styles[`size_${size}`] || ''} ${className}`}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <button type="button" className={styles.close} aria-label="Fechar" onClick={onClose}>
          ×
        </button>
      </header>
      <div className={styles.body}>{children}</div>
    </NativeDialog>
  );
}
