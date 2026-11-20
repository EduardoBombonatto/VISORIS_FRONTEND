'use client';

import React, { useId } from 'react';
import NativeDialog from '@/components/ui/NativeDialog';
import styles from './ConfirmDeleteModal.module.css';

interface ConfirmDeleteModalProps {
  open: boolean;
  templateTitle: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDeleteModal({
  open,
  templateTitle,
  isDeleting = false,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  const titleId = useId();

  return (
    <NativeDialog
      open={open}
      onClose={onClose}
      dismissible={!isDeleting}
      ariaLabelledBy={titleId}
      className={styles.dialog}
    >
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
          <h3 id={titleId} className={styles.title}>
            Excluir Modelo de Laudo
          </h3>
          <p className={styles.description}>
            Tem certeza que deseja excluir o modelo{' '}
            <span className={styles.templateName}>&quot;{templateTitle}&quot;</span>? Esta ação é
            irreversível e removerá permanentemente o modelo da sua biblioteca.
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnCancel}
          onClick={onClose}
          disabled={isDeleting}
          autoFocus
        >
          Cancelar
        </button>
        <button
          type="button"
          className={styles.btnDanger}
          onClick={onConfirm}
          disabled={isDeleting}
          aria-label="Confirmar exclusão de template"
        >
          {isDeleting && <div className={styles.spinner} aria-hidden="true" />}
          <span>{isDeleting ? 'Excluindo...' : 'Sim, excluir'}</span>
        </button>
      </div>
    </NativeDialog>
  );
}
