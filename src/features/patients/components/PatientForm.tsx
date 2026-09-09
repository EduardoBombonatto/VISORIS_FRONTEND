import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { patientRegistrationSchema, PatientRegistrationFormData } from '../schemas/patient.schema';
import { useClientsCreate, getClientsListQueryKey } from '@/api/clients/clients';
import { usePatientsCreate, getPatientsListQueryKey } from '@/api/patients/patients';
import { CreateClientResponse } from '@/api/index.schemas';
import styles from '../styles/PatientForm.module.css';

interface PatientFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function PatientForm({ onSuccess, onCancel }: PatientFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientRegistrationFormData>({
    resolver: zodResolver(patientRegistrationSchema),
    mode: 'onChange',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const createClient = useClientsCreate();
  const createPatient = usePatientsCreate();

  const onSubmit = async (data: PatientRegistrationFormData) => {
    setIsSubmitting(true);
    setGlobalError(null);

    try {
      // 1. Create Tutor (Client)
      let clientResp;
      try {
        clientResp = await createClient.mutateAsync({
          data: {
            full_name: data.client.name,
            email: data.client.email,
            document_cpf: data.client.cpf || '',
            phone: data.client.phone || '',
          },
        });
      } catch {
        setGlobalError('Erro ao criar tutor. Verifique se o e-mail ou CPF já existem.');
        setIsSubmitting(false);
        return;
      }

      const clientId = (clientResp?.data?.data as CreateClientResponse)?.id;
      if (!clientId) throw new Error('ID do cliente não retornado');

      // 2. Create Patient
      try {
        await createPatient.mutateAsync({
          data: {
            client_id: clientId as unknown as number,
            name: data.patient.name,
            patient_type: 'HUMAN',
            birth_date: data.patient.biological_details?.birthDate || '',
            biological_details: {
              gender: data.patient.biological_details?.gender,
              allergies: data.patient.allergies
                ? data.patient.allergies.split(',').map((s) => s.trim())
                : undefined,
              healthPlan: data.patient.healthPlan,
            },
          },
        });
      } catch {
        setGlobalError('Tutor criado, mas ocorreu um erro ao criar o paciente. Tente novamente.');
        setIsSubmitting(false);
        return;
      }

      // 3. Success -> Invalidate queries
      queryClient.invalidateQueries({ queryKey: getClientsListQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getPatientsListQueryKey({ clientId: clientId as unknown as number }),
      });

      onSuccess();
    } catch {
      setGlobalError('Erro inesperado durante o cadastro.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {isSubmitting && (
        <div className={styles.submittingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {globalError && <div className={styles.globalError}>{globalError}</div>}

      <div>
        <h3 className={styles.sectionTitle}>Dados do Tutor</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>Nome Completo *</label>
            <input {...register('client.name')} className={styles.input} />
            {errors.client?.name && (
              <p className={styles.errorText}>{errors.client.name.message}</p>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>E-mail *</label>
            <input {...register('client.email')} type="email" className={styles.input} />
            {errors.client?.email && (
              <p className={styles.errorText}>{errors.client.email.message}</p>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>CPF</label>
            <input {...register('client.cpf')} className={styles.input} />
            {errors.client?.cpf && <p className={styles.errorText}>{errors.client.cpf.message}</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Telefone</label>
            <input {...register('client.phone')} className={styles.input} />
          </div>
        </div>
      </div>

      <div>
        <h3 className={styles.sectionTitle}>Dados do Paciente</h3>
        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.colSpan2}`}>
            <label className={styles.label}>Nome Completo *</label>
            <input {...register('patient.name')} className={styles.input} />
            {errors.patient?.name && (
              <p className={styles.errorText}>{errors.patient.name.message}</p>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Data de Nascimento</label>
            <input
              {...register('patient.biological_details.birthDate')}
              type="date"
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Gênero</label>
            <select {...register('patient.biological_details.gender')} className={styles.input}>
              <option value="">Selecione</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMININO">Feminino</option>
              <option value="OUTROS">Outros</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Convênio</label>
            <input {...register('patient.healthPlan')} className={styles.input} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Alergias (separadas por vírgula)</label>
            <input {...register('patient.allergies')} className={styles.input} />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.btnCancel}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={styles.btnSubmit}>
          Salvar Cadastro
        </button>
      </div>
    </form>
  );
}
