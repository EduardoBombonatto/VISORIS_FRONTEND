'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Alert from '@/components/ui/Alert';
import RequirementsList, { type RequirementItem } from '@/components/ui/RequirementsList';
import { registerSchema, type RegisterFormValues } from '../schemas/register.schema';
import { useAuthRegister } from '@/api/auth/auth';
import type { AuthRegister201 } from '@/api/index.schemas';
import { ApiError } from '@/lib/axios';
import { useAuthStore } from '@/store/auth-store';
import { getPostAuthDestination } from '../utils/post-auth';
import styles from './RegisterForm.module.css';

export default function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      documentType: 'CRM',
      professionalDocument: '',
      acceptTerms: false,
    },
  });

  const password = useWatch({ control, name: 'password' }) ?? '';
  const documentType = useWatch({ control, name: 'documentType' });
  const professionalDocument = useWatch({ control, name: 'professionalDocument' }) ?? '';

  const passwordRequirements: RequirementItem[] = [
    { label: '8+ caracteres', met: password.length >= 8 },
    { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', met: /[a-z]/.test(password) },
    { label: 'Número', met: /[0-9]/.test(password) },
    { label: 'Caractere especial', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const crmRequirements: RequirementItem[] = [
    { label: 'Contém números', met: /\d/.test(professionalDocument) },
    { label: 'Contém a UF (ex: SP)', met: /[A-Za-z]{2}/.test(professionalDocument) },
  ];

  const mutation = useAuthRegister<ApiError>({
    mutation: {
      onSuccess: (result) => {
        const envelope = result.data as AuthRegister201;
        const { user } = envelope.data;
        setSession(user, []);
        router.push(getPostAuthDestination([]));
      },
      onError: (error) => {
        if (error.fieldErrors.length > 0) {
          error.fieldErrors.forEach(({ field, message }) => {
            setError(field as 'fullName' | 'email' | 'password' | 'professionalDocument', {
              type: 'server',
              message,
            });
          });
        } else {
          setGlobalError(error.message);
        }
      },
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    setGlobalError(null);
    mutation.mutate({
      data: {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        professionalDocument: `${values.documentType}/${values.professionalDocument}`,
      },
    });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Crie sua conta</h2>
      <p className={styles.subtitle}>Teste grátis por 7 dias. Sem cartão de crédito.</p>

      {globalError ? <Alert variant="error">{globalError}</Alert> : null}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Nome Completo"
          type="text"
          placeholder="Dr. João Silva"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <div className={styles.row}>
          <div className={styles.documentRow}>
            <div className={styles.documentInput}>
              <Input
                label={documentType}
                type="text"
                placeholder="00000-SP"
                autoComplete="off"
                error={errors.professionalDocument?.message}
                {...register('professionalDocument')}
              />
            </div>
            <div className={styles.segmented} role="radiogroup" aria-label="Tipo de documento">
              <label className={styles.segment}>
                <input type="radio" value="CRM" {...register('documentType')} />
                <span>CRM</span>
              </label>
              <label className={styles.segment}>
                <input type="radio" value="CRMV" {...register('documentType')} />
                <span>CRMV</span>
              </label>
            </div>
          </div>
          <RequirementsList items={crmRequirements} />
        </div>

        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com.br"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Senha"
          type="password"
          placeholder="Crie uma senha forte"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <RequirementsList items={passwordRequirements} />

        <Checkbox
          label={
            <>
              Ao criar a conta, você concorda com nossos{' '}
              <a href="#" className={styles.termsLink}>
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="#" className={styles.termsLink}>
                Política de Privacidade
              </a>
              .
            </>
          }
          error={errors.acceptTerms?.message}
          {...register('acceptTerms')}
        />

        <Button type="submit" loading={mutation.isPending} className={styles.submit}>
          Criar Conta e Iniciar Teste
        </Button>
      </form>
    </div>
  );
}
