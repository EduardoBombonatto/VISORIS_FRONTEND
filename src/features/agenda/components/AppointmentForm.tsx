'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useClinicsList } from '@/api/clinics/clinics';
import { useClientsList } from '@/api/clients/clients';
import { usePatientsList } from '@/api/patients/patients';
import { useCreateAppointment, getListAppointmentsQueryKey } from '@/api/appointments/appointments';
import type { ClinicData, ClientResponse, PatientResponse } from '@/api/index.schemas';
import {
  createAppointmentSchema,
  type CreateAppointmentFormInput,
  type CreateAppointmentFormValues,
} from '../schemas/appointment.schema';
import {
  formatDateToYYYYMMDD,
  parseDateAndTimeToISO,
  extractClinicsList,
  extractClientsList,
  extractPatientsList,
} from '../utils/formatters';
import styles from '../styles/AppointmentForm.module.css';

interface AppointmentFormProps {
  onSuccess: (scheduledDate?: string) => void;
  onCancel: () => void;
  initialDate?: string;
}

export function AppointmentForm({ onSuccess, onCancel, initialDate }: AppointmentFormProps) {
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');
  const [isClientComboboxOpen, setIsClientComboboxOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 1. Consulta de Clínicas
  const { data: clinicsData, isLoading: isLoadingClinics } = useClinicsList();
  const clinics: ClinicData[] = useMemo(() => {
    return extractClinicsList(clinicsData);
  }, [clinicsData]);

  // 2. Consulta de Tutores/Clientes
  const { data: clientsData, isLoading: isLoadingClients } = useClientsList();
  const clients: ClientResponse[] = useMemo(() => {
    return extractClientsList(clientsData);
  }, [clientsData]);

  // 3. Consulta de Pacientes vinculados ao Tutor selecionado
  const isClientValid = Boolean(selectedClientId && selectedClientId.trim().length > 0);

  const { data: patientsData, isLoading: isLoadingPatients } = usePatientsList(
    { clientId: isClientValid ? selectedClientId : '' },
    {
      query: {
        enabled: isClientValid,
      },
    },
  );

  const patients: PatientResponse[] = useMemo(() => {
    return extractPatientsList(patientsData);
  }, [patientsData]);

  const createMutation = useCreateAppointment();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateAppointmentFormInput, unknown, CreateAppointmentFormValues>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      clinic_id: '',
      patient_id: '',
      scheduledDate: initialDate || formatDateToYYYYMMDD(new Date()),
      scheduledTime: '08:00',
      procedure_name: '',
      price: undefined,
      payment_status: 'UNPAID',
    },
  });

  const patientId = useWatch({ control, name: 'patient_id' });

  // Filtro de Tutores/Clientes no combobox
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const query = clientSearch.toLowerCase();
    return clients.filter((c) => {
      const nameMatch = c.fullName?.toLowerCase().includes(query);
      const cpfMatch = c.documentCpf?.includes(query);
      return nameMatch || cpfMatch;
    });
  }, [clients, clientSearch]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  // Paciente selecionado derivado de forma reativa
  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === patientId) || (patients.length === 1 ? patients[0] : null);
  }, [patients, patientId]);

  // Auto-seleciona o paciente se houver apenas 1 para o tutor
  useEffect(() => {
    if (patients.length === 1 && !patientId) {
      setValue('patient_id', patients[0].id, { shouldValidate: true });
    }
  }, [patients, patientId, setValue]);

  const handleSelectClient = (client: ClientResponse) => {
    setSelectedClientId(client.id);
    setValue('patient_id', '', { shouldValidate: true });
    setClientSearch('');
    setIsClientComboboxOpen(false);
  };

  const handleClearClient = () => {
    setSelectedClientId('');
    setValue('patient_id', '', { shouldValidate: true });
    setClientSearch('');
  };

  const onSubmit = async (values: CreateAppointmentFormValues) => {
    setSubmitError(null);
    try {
      const scheduled_at = parseDateAndTimeToISO(values.scheduledDate, values.scheduledTime);

      await createMutation.mutateAsync({
        data: {
          clinic_id: values.clinic_id,
          patient_id: values.patient_id,
          scheduled_at,
          procedure_name: values.procedure_name,
          price: values.price !== undefined ? Number(values.price) : undefined,
          payment_status: values.payment_status,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: getListAppointmentsQueryKey(),
      });

      onSuccess(values.scheduledDate);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Falha ao salvar agendamento. Tente novamente.';
      setSubmitError(errorMsg);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      {submitError && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '8px',
            color: '#b91c1c',
            fontSize: '0.875rem',
          }}
        >
          {submitError}
        </div>
      )}

      {/* Alerta se não houver clínicas */}
      {!isLoadingClinics && clinics.length === 0 && (
        <div className={styles.emptyNotice}>
          <span>⚠️ Nenhuma clínica cadastrada.</span>
          <Link href="/clinics">Cadastre uma clínica</Link> antes de agendar.
        </div>
      )}

      {/* Alerta se não houver clientes/tutores */}
      {!isLoadingClients && clients.length === 0 && (
        <div className={styles.emptyNotice}>
          <span>⚠️ Nenhum paciente/tutor cadastrado.</span>
          <Link href="/patients">Cadastre um paciente</Link> antes de agendar.
        </div>
      )}

      {/* 1. Seleção de Clínica */}
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="clinic_id">
          Clínica <span className={styles.required}>*</span>
        </label>
        <select
          id="clinic_id"
          className={`${styles.select} ${errors.clinic_id ? styles.inputError : ''}`}
          {...register('clinic_id')}
          disabled={isLoadingClinics || clinics.length === 0}
        >
          <option value="">Selecione uma clínica...</option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
        {errors.clinic_id && <span className={styles.errorText}>{errors.clinic_id.message}</span>}
      </div>

      {/* 2. Seleção de Tutor / Responsável (Combobox com busca textual) */}
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="client_search">
          Tutor / Cliente <span className={styles.required}>*</span>
        </label>

        {selectedClient ? (
          <div className={styles.selectedPatientBadge}>
            <div>
              <strong>{selectedClient.fullName}</strong>
              {selectedClient.documentCpf && (
                <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#047857' }}>
                  (CPF: {selectedClient.documentCpf})
                </span>
              )}
            </div>
            <button
              type="button"
              className={styles.clearPatientBtn}
              onClick={handleClearClient}
              title="Trocar tutor/cliente"
            >
              ✕ Alterar
            </button>
          </div>
        ) : (
          <div className={styles.comboboxWrapper}>
            <input
              id="client_search"
              type="text"
              className={styles.comboboxInput}
              placeholder="Digite o nome ou CPF do tutor para buscar..."
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setIsClientComboboxOpen(true);
              }}
              onFocus={() => setIsClientComboboxOpen(true)}
              disabled={isLoadingClients || clients.length === 0}
            />

            {isClientComboboxOpen && (
              <div className={styles.comboboxDropdown}>
                {filteredClients.length === 0 ? (
                  <div style={{ padding: '12px', fontSize: '0.825rem', color: '#6b7280' }}>
                    Nenhum tutor/cliente correspondente encontrado.
                  </div>
                ) : (
                  filteredClients.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      className={styles.comboboxOption}
                      onClick={() => handleSelectClient(c)}
                    >
                      <span>
                        <strong>{c.fullName}</strong>
                      </span>
                      {c.documentCpf && (
                        <span className={styles.comboboxOptionSub}>CPF: {c.documentCpf}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Seleção de Paciente */}
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="patient_select">
          Paciente <span className={styles.required}>*</span>
        </label>

        {!selectedClientId ? (
          <div style={{ fontSize: '0.825rem', color: '#6b7280', fontStyle: 'italic' }}>
            Selecione primeiro o tutor/cliente acima para listar os pacientes.
          </div>
        ) : isLoadingPatients ? (
          <div style={{ fontSize: '0.825rem', color: '#6b7280' }}>
            Carregando pacientes do tutor...
          </div>
        ) : patients.length === 0 ? (
          <div className={styles.emptyNotice}>
            <span>Nenhum paciente cadastrado para este tutor.</span>
            <Link href="/patients">Adicionar pet/paciente</Link>
          </div>
        ) : (
          <select
            id="patient_select"
            className={`${styles.select} ${errors.patient_id ? styles.inputError : ''}`}
            value={patientId || selectedPatient?.id || ''}
            onChange={(e) => {
              setValue('patient_id', e.target.value, { shouldValidate: true });
            }}
          >
            <option value="">Selecione o paciente...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.patientType ? `(${p.patientType})` : ''}
              </option>
            ))}
          </select>
        )}

        {errors.patient_id && <span className={styles.errorText}>{errors.patient_id.message}</span>}
      </div>

      {/* 4. Procedimento / Exame */}
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="procedure_name">
          Procedimento / Exame <span className={styles.required}>*</span>
        </label>
        <input
          id="procedure_name"
          type="text"
          placeholder="Ex: Endoscopia Digestiva Alta"
          className={`${styles.input} ${errors.procedure_name ? styles.inputError : ''}`}
          {...register('procedure_name')}
        />
        {errors.procedure_name && (
          <span className={styles.errorText}>{errors.procedure_name.message}</span>
        )}
      </div>

      {/* 5. Data e Horário */}
      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="scheduledDate">
            Data <span className={styles.required}>*</span>
          </label>
          <input
            id="scheduledDate"
            type="date"
            className={`${styles.input} ${errors.scheduledDate ? styles.inputError : ''}`}
            {...register('scheduledDate')}
          />
          {errors.scheduledDate && (
            <span className={styles.errorText}>{errors.scheduledDate.message}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="scheduledTime">
            Horário <span className={styles.required}>*</span>
          </label>
          <input
            id="scheduledTime"
            type="time"
            className={`${styles.input} ${errors.scheduledTime ? styles.inputError : ''}`}
            {...register('scheduledTime')}
          />
          {errors.scheduledTime && (
            <span className={styles.errorText}>{errors.scheduledTime.message}</span>
          )}
        </div>
      </div>

      {/* 6. Cobrança e Valor */}
      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="payment_status">
            Cobrança / Seguro
          </label>
          <select
            id="payment_status"
            className={`${styles.select} ${errors.payment_status ? styles.inputError : ''}`}
            {...register('payment_status')}
          >
            <option value="UNPAID">Particular (A Receber)</option>
            <option value="PAID">Particular (Pago)</option>
            <option value="INSURANCE">Seguro / Convênio</option>
          </select>
          {errors.payment_status && (
            <span className={styles.errorText}>{errors.payment_status.message}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="price">
            Valor (R$) <span style={{ fontWeight: 'normal', color: '#6b7280' }}>(Opcional)</span>
          </label>
          <input
            id="price"
            type="text"
            placeholder="0,00"
            className={`${styles.input} ${errors.price ? styles.inputError : ''}`}
            {...register('price')}
          />
          {errors.price && <span className={styles.errorText}>{errors.price.message}</span>}
        </div>
      </div>

      {/* Ações */}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.btnCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={styles.btnSubmit}
          disabled={isSubmitting || clinics.length === 0 || !selectedPatient}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Agendamento'}
        </button>
      </div>
    </form>
  );
}
