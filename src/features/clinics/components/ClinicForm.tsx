'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useClinicsCreate, getClinicsListQueryKey } from '@/api/clinics/clinics';
import { ApiError } from '@/lib/axios';
import { clinicSchema, type ClinicFormValues } from '../schemas/clinic.schema';
import { serverFieldToFormField, toCreateClinicRequest } from '../utils/clinic-mappers';
import { maskCnpj, maskPhone } from '../utils/masks';
import type { ClinicData } from '@/api/index.schemas';
import styles from './ClinicForm.module.css';

interface ClinicFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ClinicForm({ onClose, onSuccess }: ClinicFormProps) {
  const queryClient = useQueryClient();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [existingClinic, setExistingClinic] = useState<ClinicData | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: { nome: '', cnpj: '', telefone: '', endereco: '' },
  });

  const mutation = useClinicsCreate<ApiError>({
    mutation: {
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: getClinicsListQueryKey() });

        if (response.status === 200) {
          setExistingClinic(response.data.data.clinic);
        } else {
          reset();
          onSuccess?.();
        }
      },
      onError: (error) => {
        if (error.fieldErrors.length > 0) {
          error.fieldErrors.forEach(({ field, message }) => {
            const formField = serverFieldToFormField(field);
            if (formField) {
              setError(formField, { type: 'server', message });
            } else {
              setGlobalError(message);
            }
          });
        } else {
          setGlobalError(error.message);
        }
      },
    },
  });

  const onSubmit = (values: ClinicFormValues) => {
    setGlobalError(null);
    mutation.mutate({ data: toCreateClinicRequest(values) });
  };

  if (existingClinic) {
    return (
      <div className={styles.card}>
        <Alert variant="success">
          Clínica já existente. Os dados foram puxados e vinculados ao seu perfil.
        </Alert>
        <div className={styles.clinicInfo}>
          <p>
            <strong>Nome:</strong> {existingClinic.name}
          </p>
          <p>
            <strong>CNPJ:</strong> {existingClinic.cnpj}
          </p>
          <p>
            <strong>Telefone:</strong> {existingClinic.phone || 'Não informado'}
          </p>
          <p>
            <strong>Endereço:</strong> {existingClinic.address || 'Não informado'}
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            onClick={() => {
              reset();
              onSuccess?.();
            }}
            className={styles.submit}
          >
            Concluir
          </Button>
        </div>
      </div>
    );
  }

  const { onChange: onCnpjChange, ...restCnpj } = register('cnpj');
  const { onChange: onPhoneChange, ...restPhone } = register('telefone');

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {globalError ? <Alert variant="error">{globalError}</Alert> : null}

      <Input
        label="CNPJ"
        placeholder="00.000.000/0000-00"
        error={errors.cnpj?.message}
        {...restCnpj}
        onChange={(e) => {
          e.target.value = maskCnpj(e.target.value);
          onCnpjChange(e);
        }}
      />
      <Input
        label="Nome da Clínica"
        placeholder="Ex.: Clínica Vida"
        error={errors.nome?.message}
        {...register('nome')}
      />
      <Input
        label="Telefone"
        placeholder="(00) 00000-0000"
        error={errors.telefone?.message}
        {...restPhone}
        onChange={(e) => {
          e.target.value = maskPhone(e.target.value);
          onPhoneChange(e);
        }}
      />
      <Input
        label="Endereço"
        placeholder="Rua, número, cidade"
        error={errors.endereco?.message}
        {...register('endereco')}
      />

      <div className={styles.actions}>
        <Button type="button" onClick={onClose} className={styles.cancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={mutation.isPending} className={styles.submit}>
          Cadastrar
        </Button>
      </div>
    </form>
  );
}
