import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Header from './Header';
import { useAuthStore } from '@/store/auth-store';
import { useAuthLogout } from '@/api/auth/auth';
import { clearSessionCookie } from '@/lib/session-cookie';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/api/auth/auth', () => ({
  useAuthLogout: vi.fn(),
}));

vi.mock('@/lib/session-cookie', () => ({
  clearSessionCookie: vi.fn(),
}));

const mutate = vi.fn();
let mutationOptions: { onSuccess?: () => void; onError?: (error: Error) => void } = {};

beforeEach(() => {
  pushMock.mockReset();
  mutate.mockReset();
  mutationOptions = {};
  vi.mocked(useAuthLogout).mockImplementation((options) => {
    mutationOptions = options?.mutation ?? {};
    return { mutate, isPending: false } as never;
  });
  useAuthStore.setState({
    user: { id: '1', fullName: 'Dra. Maria Souza', professionalDocument: null },
  });
});

describe('Header', () => {
  it('exibe o nome do profissional logado', () => {
    render(<Header />);
    expect(screen.getByText('Dra. Maria Souza')).toBeInTheDocument();
  });

  it('exibe o botão Sair', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  it('Sair chama a mutação de logout', () => {
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(mutate).toHaveBeenCalled();
  });

  it('em sucesso limpa o estado, o cookie de sessão e redireciona para /auth', () => {
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    mutationOptions.onSuccess?.();

    expect(useAuthStore.getState().user).toBeNull();
    expect(clearSessionCookie).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/auth');
  });

  it('em erro exibe alerta e permanece na página', async () => {
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    mutationOptions.onError?.(new Error('Falha no logout.'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha no logout.');
    expect(pushMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user).not.toBeNull();
  });
});
