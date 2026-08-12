import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AuthPage from './AuthPage';

vi.mock('@/api/auth/auth', () => ({
  useAuthLogin: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useAuthRegister: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthPage', () => {
  it('exibe o formulário de login por padrão', () => {
    render(<AuthPage />);
    expect(screen.getByText('Bem-vindo de volta!')).toBeInTheDocument();
  });

  it('alterna para o formulário de cadastro ao clicar em Criar Conta', () => {
    render(<AuthPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Criar Conta' }));

    expect(screen.getByText('Crie sua conta')).toBeInTheDocument();
  });

  it('volta ao formulário de login ao clicar em Entrar', () => {
    render(<AuthPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Criar Conta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Bem-vindo de volta!')).toBeInTheDocument();
  });
});
