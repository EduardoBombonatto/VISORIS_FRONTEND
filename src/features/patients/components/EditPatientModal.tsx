'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { PatientResponse } from '@/api/index.schemas';
import { usePatientsUpdate, getPatientsListQueryKey } from '@/api/patients/patients';
import { patientUpdateSchema, PatientUpdateFormData } from '../schemas/patient.schema';
import styles from '../styles/EditPatientModal.module.css';

interface EditPatientModalProps {
  open: boolean;
  patient: PatientResponse;
  clientId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditPatientModal({
  open,
  patient,
  clientId,
  onClose,
  onSuccess,
}: EditPatientModalProps) {
  const queryClient = useQueryClient();
  const updatePatient = usePatientsUpdate();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const bio = (patient.biologicalDetails || {}) as Record<string, unknown>;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientUpdateFormData>({
    resolver: zodResolver(patientUpdateSchema),
    defaultValues: {
      name: patient.name || '',
      species: String(bio.species || 'Canino'),
      breed: String(bio.breed || ''),
      coatColor: String(bio.coat_color || bio.coatColor || ''),
      birthDate: patient.birthDate || '',
      age: String(bio.age || ''),
    },
  });

  useEffect(() => {
    if (open) {
      const b = (patient.biologicalDetails || {}) as Record<string, unknown>;
      reset({
        name: patient.name || '',
        species: String(b.species || 'Canino'),
        breed: String(b.breed || ''),
        coatColor: String(b.coat_color || b.coatColor || ''),
        birthDate: patient.birthDate || '',
        age: String(b.age || ''),
      });
    }
  }, [open, patient, reset]);

  if (!open) return null;

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('birthDate', val);

    if (val) {
      const birth = new Date(val);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
        years--;
        months += 12;
      }
      if (years > 0) {
        setValue('age', `${years} ano${years > 1 ? 's' : ''}`);
      } else if (months > 0) {
        setValue('age', `${months} m${months > 1 ? 'eses' : 'ês'}`);
      } else {
        setValue('age', 'Menos de 1 mês');
      }
    }
  };

  const onSubmit = async (data: PatientUpdateFormData) => {
    setGlobalError(null);

    try {
      let birthDateToSend = data.birthDate;
      if (!birthDateToSend && data.age) {
        const match = data.age.match(/\d+/);
        const years = match ? parseInt(match[0], 10) : 1;
        const estimatedDate = new Date();
        estimatedDate.setFullYear(estimatedDate.getFullYear() - years);
        birthDateToSend = estimatedDate.toISOString().split('T')[0];
      }

      if (!birthDateToSend) {
        birthDateToSend = new Date().toISOString().split('T')[0];
      }

      await updatePatient.mutateAsync({
        id: patient.id as unknown as number,
        data: {
          name: data.name,
          patient_type: 'PET',
          birth_date: birthDateToSend,
          biological_details: {
            species: data.species,
            breed: data.breed || 'Não informada',
            coat_color: data.coatColor || 'Não informada',
            age: data.age || 'Não informada',
          },
        },
      });

      queryClient.invalidateQueries({
        queryKey: getPatientsListQueryKey({ clientId: clientId as unknown as number }),
      });
      onSuccess?.();
      onClose();
    } catch {
      setGlobalError('Erro ao atualizar dados do pet. Tente novamente.');
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
      aria-labelledby="edit-patient-modal-title"
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 id="edit-patient-modal-title" className={styles.modalTitle}>
            Editar Paciente ({patient.name})
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
                <label htmlFor="editPatientSpecies" className={styles.label}>
                  Espécie *
                </label>
                <select
                  id="editPatientSpecies"
                  {...register('species')}
                  className={styles.input}
                  disabled={isSubmitting}
                >
                  <option value="Canino">Canino (Cachorro)</option>
                  <option value="Felino">Felino (Gato)</option>
                  <option value="Equino">Equino (Cavalo)</option>
                  <option value="Bovino">Bovino</option>
                  <option value="Ave">Ave</option>
                  <option value="Roedor">Roedor</option>
                  <option value="Réptil">Réptil</option>
                  <option value="Outro">Outro</option>
                </select>
                {errors.species && <p className={styles.errorText}>{errors.species.message}</p>}
              </div>

              <div className={styles.field}>
                <label htmlFor="editPatientName" className={styles.label}>
                  Nome do Pet *
                </label>
                <input
                  id="editPatientName"
                  {...register('name')}
                  placeholder="Ex: Rex, Thor, Mel..."
                  className={styles.input}
                  disabled={isSubmitting}
                />
                {errors.name && <p className={styles.errorText}>{errors.name.message}</p>}
              </div>

              <div className={styles.field}>
                <label htmlFor="editPatientBirthDate" className={styles.label}>
                  Data de Nascimento
                </label>
                <input
                  id="editPatientBirthDate"
                  type="date"
                  {...register('birthDate')}
                  onChange={handleBirthDateChange}
                  className={styles.input}
                  disabled={isSubmitting}
                />
                {errors.birthDate && <p className={styles.errorText}>{errors.birthDate.message}</p>}
              </div>

              <div className={styles.field}>
                <label htmlFor="editPatientAge" className={styles.label}>
                  Ou Idade aproximada
                </label>
                <input
                  id="editPatientAge"
                  {...register('age')}
                  placeholder="Ex: 3 anos, 6 meses..."
                  className={styles.input}
                  disabled={isSubmitting}
                />
                <span className={styles.helperText}>Informe a data de nascimento ou a idade.</span>
              </div>

              <div className={styles.field}>
                <label htmlFor="editPatientBreed" className={styles.label}>
                  Raça
                </label>
                <input
                  id="editPatientBreed"
                  {...register('breed')}
                  placeholder="Ex: SRD, Poodle, Siamês..."
                  className={styles.input}
                  disabled={isSubmitting}
                />
                {errors.breed && <p className={styles.errorText}>{errors.breed.message}</p>}
              </div>

              <div className={styles.field}>
                <label htmlFor="editPatientCoatColor" className={styles.label}>
                  Cor da Pelagem
                </label>
                <input
                  id="editPatientCoatColor"
                  {...register('coatColor')}
                  placeholder="Ex: Caramelo, Preto, Branco..."
                  className={styles.input}
                  disabled={isSubmitting}
                />
                {errors.coatColor && <p className={styles.errorText}>{errors.coatColor.message}</p>}
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
