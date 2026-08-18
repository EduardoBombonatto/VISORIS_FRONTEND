'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { useAuthStore } from '@/store/auth-store';
import { useAuthSelectWorkspace } from '@/api/auth/auth';
import type { AuthSelectWorkspace200 } from '@/api/index.schemas';
import { ApiError } from '@/lib/axios';
import styles from './WorkspaceSelection.module.css';

export default function WorkspaceSelection() {
  const router = useRouter();
  const workspaces = useAuthStore((state) => state.workspaces);
  const setActiveWorkspace = useAuthStore((state) => state.setActiveWorkspace);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const mutation = useAuthSelectWorkspace<ApiError>();

  const onSelect = (clinicId: string) => {
    setSelectedId(clinicId);
    setGlobalError(null);
    mutation.mutate(
      { data: { clinicId } },
      {
        onSuccess: (result) => {
          const envelope = result.data as AuthSelectWorkspace200;
          setActiveWorkspace(envelope.data.activeWorkspace);
          router.replace('/dashboard');
        },
        onError: (error) => {
          setGlobalError(error.message);
          setSelectedId(null);
        },
      },
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Selecione a clínica</h1>
      <p className={styles.subtitle}>Escolha em qual clínica ou consultório deseja trabalhar.</p>

      {globalError ? <Alert variant="error">{globalError}</Alert> : null}

      <div className={styles.cards}>
        {workspaces.map((workspace) => {
          const isSelected = selectedId === workspace.clinicId;
          const disabled = selectedId !== null && !isSelected;
          return (
            <button
              key={workspace.clinicId}
              type="button"
              className={styles.card}
              onClick={() => onSelect(workspace.clinicId)}
              disabled={disabled || mutation.isPending}
            >
              <span className={styles.cardName}>{workspace.name}</span>
              {isSelected ? <Spinner size="small" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
