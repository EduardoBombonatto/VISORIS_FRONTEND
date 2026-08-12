import { customInstance } from '@/lib/axios';
import type { LoginResponse } from '@/api/index.schemas';

export type AuthMe200 = {
  erro: boolean;
  message: string;
  data: LoginResponse;
  httpcode: number;
  timestamp: string;
};

export async function fetchSession(): Promise<AuthMe200> {
  const res = await customInstance<{ data: AuthMe200 }>('/api/v1/auth/me', { method: 'GET' });
  return res.data;
}
