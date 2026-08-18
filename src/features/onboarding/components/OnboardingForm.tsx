'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { onboardingSchema, type OnboardingFormValues } from '../schemas/onboarding.schema';
import { useCreateWorkspace } from '../api/create-workspace';
import { useAuthStore } from '@/store/auth-store';
import styles from './OnboardingForm.module.css';

export default function OnboardingForm() {
  const router = useRouter();
  const addWorkspace = useAuthStore((state) => state.addWorkspace);
  const setActiveWorkspace = useAuthStore((state) => state.setActiveWorkspace);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: '' },
  });

  const mutation = useCreateWorkspace();

  const onSubmit = (values: OnboardingFormValues) => {
    setGlobalError(null);
    mutation.mutate(
      { name: values.name },
      {
        onSuccess: (workspace) => {
          addWorkspace(workspace);
          setActiveWorkspace(workspace);
          router.replace('/dashboard');
        },
        onError: (error) => {
          setGlobalError(error.message);
        },
      },
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crie sua clínica</h1>
        <p className={styles.subtitle}>
          Para começar, informe o nome da sua clínica ou consultório.
        </p>

        {globalError ? <Alert variant="error">{globalError}</Alert> : null}

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Nome da Clínica"
            placeholder="Ex: Clínica Visoris Centro"
            error={errors.name?.message}
            {...register('name')}
          />
          <Button type="submit" loading={mutation.isPending} className={styles.submit}>
            Criar Clínica
          </Button>
        </form>
      </div>
    </div>
  );
}
