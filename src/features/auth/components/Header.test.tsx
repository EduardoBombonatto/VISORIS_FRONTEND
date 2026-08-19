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
    workspaces: [
      { clinicId: '10', name: 'Clínica A', role: 'DOCTOR' },
      { clinicId: '20', name: 'Clínica B', role: 'OWNER' },
    ],
    activeWorkspace: { clinicId: '10', name: 'Clínica A', role: 'DOCTOR' },
  });
});

describe('Header', () => {
  it('exibe o nome do médico e a clínica ativa', () => {
    render(<Header />);
    expect(screen.getByText('Dra. Maria Souza')).toBeInTheDocument();
    expect(screen.getByText('Clínica A')).toBeInTheDocument();
  });

  it('exibe os botões Trocar Clínica e Sair', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: 'Trocar Clínica' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  it('Trocar Clínica redireciona para /workspace', () => {
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Trocar Clínica' }));
    expect(pushMock).toHaveBeenCalledWith('/workspace');
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
    expect(useAuthStore.getState().workspaces).toEqual([]);
    expect(useAuthStore.getState().activeWorkspace).toBeNull();
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
