'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { loginSchema, type LoginFormValues } from '../schemas/login.schema';
import { useAuthLogin } from '@/api/auth/auth';
import type { AuthLogin200 } from '@/api/index.schemas';
import { ApiError } from '@/lib/axios';
import { useAuthStore } from '@/store/auth-store';
import { setSessionCookie } from '@/lib/session-cookie';
import styles from './LoginForm.module.css';

export default function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useAuthLogin<ApiError>({
    mutation: {
      onSuccess: (result) => {
        const envelope = result.data as AuthLogin200;
        const { user } = envelope.data;
        setSession(user);
        setSessionCookie();
        router.push('/dashboard');
      },
      onError: (error) => {
        if (error.fieldErrors.length > 0) {
          error.fieldErrors.forEach(({ field, message }) => {
            setError(field as 'email' | 'password', {
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

  const onSubmit = (values: LoginFormValues) => {
    setGlobalError(null);
    mutation.mutate({ data: { email: values.email, password: values.password } });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Bem-vindo de volta!</h2>
      <p className={styles.subtitle}>Insira seus dados para acessar o sistema.</p>

      {globalError ? <Alert variant="error">{globalError}</Alert> : null}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="E-mail"
          type="email"
          placeholder="dr@clinica.com.br"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <div className={styles.passwordHeader}>
            <label className={styles.passwordLabel} htmlFor="password">
              Senha
            </label>
            <a className={styles.forgotLink} href="#">
              Esqueceu a senha?
            </a>
          </div>
          <Input
            id="password"
            label=""
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <Button type="submit" loading={mutation.isPending} className={styles.submit}>
          Acessar Sistema
        </Button>
      </form>
    </div>
  );
}
