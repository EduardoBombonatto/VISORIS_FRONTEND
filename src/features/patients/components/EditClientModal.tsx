'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ClientResponse } from '@/api/index.schemas';
import { useClientsUpdate, getClientsListQueryKey } from '@/api/clients/clients';
import { clientUpdateSchema, ClientUpdateFormData } from '../schemas/patient.schema';
import styles from '../styles/EditClientModal.module.css';

interface EditClientModalProps {
  open: boolean;
  client: ClientResponse;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditClientModal({ open, client, onClose, onSuccess }: EditClientModalProps) {
  const queryClient = useQueryClient();
  const updateClient = useClientsUpdate();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientUpdateFormData>({
    resolver: zodResolver(clientUpdateSchema),
    defaultValues: {
      name: client.fullName || '',
      email: client.email || '',
      cpf: client.documentCpf || '',
      phone: client.phone || '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: client.fullName || '',
        email: client.email || '',
        cpf: client.documentCpf || '',
        phone: client.phone || '',
      });
    }
  }, [open, client, reset]);

  if (!open) return null;

  const onSubmit = async (data: ClientUpdateFormData) => {
    setGlobalError(null);
    try {
      await updateClient.mutateAsync({
        id: client.id as unknown as number,
        data: {
          full_name: data.name,
          email: data.email,
          document_cpf: data.cpf ? data.cpf.replace(/\D/g, '') : '',
          phone: data.phone ? data.phone.replace(/\D/g, '') : '',
        },
      });

      queryClient.invalidateQueries({ queryKey: getClientsListQueryKey() });
      onSuccess?.();
      onClose();
    } catch {
      setGlobalError('Erro ao atualizar tutor. Verifique os dados informados.');
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-client-modal-title"
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 id="edit-client-modal-title" className={styles.modalTitle}>
            Editar Tutor
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Fechar"
            disabled={isSubmitting}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
            {globalError && <div className={styles.globalError}>{globalError}</div>}

            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="editClientName" className={styles.label}>
                  Nome Completo *
                </label>
                <input
                  id="editClientName"
                  {...register('name')}
                  placeholder="Nome do tutor"
                  className={styles.input}
                  disabled={isSubmitting}
                />
                {errors.name && <p className={styles.errorText}>{errors.name.message}</p>}
              </div>

              <div className={styles.field}>
                <label htmlFor="editClientEmail" className={styles.label}>
                  E-mail *
                </label>
                <input
                  id="editClientEmail"
                  type="email"
                  {...register('email')}
                  placeholder="email@exemplo.com"
                  className={styles.input}
                  disabled={isSubmitting}
                />
                {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}
              </div>

              <div className={styles.field}>
                <label htmlFor="editClientCpf" className={styles.label}>
                  CPF
                </label>
                <input
                  id="editClientCpf"
                  {...register('cpf')}
                  placeholder="000.000.000-00"
                  className={styles.input}
                  disabled={isSubmitting}
                />
                {errors.cpf && <p className={styles.errorText}>{errors.cpf.message}</p>}
              </div>

              <div className={styles.field}>
                <label htmlFor="editClientPhone" className={styles.label}>
                  Telefone
                </label>
                <input
                  id="editClientPhone"
                  {...register('phone')}
                  placeholder="(00) 00000-0000"
                  className={styles.input}
                  disabled={isSubmitting}
                />
                {errors.phone && <p className={styles.errorText}>{errors.phone.message}</p>}
              </div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.btnCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                {isSubmitting && <div className={styles.spinner} />}
                <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
