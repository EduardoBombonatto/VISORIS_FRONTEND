import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './auth-store';
import type { UserData } from '@/api/index.schemas';

const user: UserData = {
  id: '8712345678901234567',
  fullName: 'Dra. Maria Souza',
  professionalDocument: 'CRM/SP 123456',
};

beforeEach(() => {
  useAuthStore.setState({ user: null });
});

describe('auth-store', () => {
  it('setSession define o usuário logado', () => {
    useAuthStore.getState().setSession(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('logout limpa o usuário', () => {
    useAuthStore.getState().setSession(user);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
