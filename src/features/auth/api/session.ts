import { customInstance } from '@/lib/axios';
import type { LoginResponse } from '@/api/index.schemas';

export type AuthMe200 = {
  erro: boolean;
  message: string;
  data: LoginResponse;
  httpcode: number;
  timestamp: string;
};

let inflightSession: Promise<AuthMe200> | null = null;

export function fetchSession(): Promise<AuthMe200> {
  if (inflightSession) return inflightSession;

  inflightSession = customInstance<{ data: AuthMe200 }>('/api/v1/auth/me', { method: 'GET' })
    .then((res) => res.data)
    .finally(() => {
      inflightSession = null;
    });

  return inflightSession;
}
