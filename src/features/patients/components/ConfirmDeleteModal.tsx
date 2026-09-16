'use client';

import React, { useEffect, useRef } from 'react';
import styles from '../styles/ConfirmDeleteModal.module.css';

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmText = 'Excluir',
  isDeleting = false,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, isDeleting]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconContainer} aria-hidden="true">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 id="confirm-dialog-title" className={styles.title}>
              {title}
            </h3>
            <p className={styles.description}>{description}</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={styles.btnDanger}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting && <div className={styles.spinner} />}
            <span>{isDeleting ? 'Excluindo...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
