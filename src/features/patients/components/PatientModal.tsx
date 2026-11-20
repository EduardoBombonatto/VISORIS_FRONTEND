'use client';

import React, { useId } from 'react';
import NativeDialog from '@/components/ui/NativeDialog';
import { PatientForm } from './PatientForm';
import styles from '../styles/PatientModal.module.css';

interface PatientModalProps {
  onClose: () => void;
  clientId?: string;
  clientName?: string;
}

export function PatientModal({ onClose, clientId, clientName }: PatientModalProps) {
  const isOnlyPet = !!clientId;
  const titleId = useId();

  return (
    <NativeDialog open onClose={onClose} ariaLabelledBy={titleId} className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <h2 id={titleId} className={styles.modalTitle}>
          {isOnlyPet ? 'Novo Paciente (Pet)' : 'Novo Cadastro (Tutor e Pet)'}
        </h2>
        <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Fechar">
          <svg
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className={styles.modalBody}>
        <PatientForm
          onSuccess={onClose}
          onCancel={onClose}
          existingClientId={clientId}
          existingClientName={clientName}
        />
      </div>
    </NativeDialog>
  );
}
