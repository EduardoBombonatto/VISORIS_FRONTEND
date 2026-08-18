import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Header from './Header';
import { useAuthStore } from '@/store/auth-store';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  pushMock.mockReset();
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

  it('Sair limpa o estado e redireciona para /auth?logout=1', () => {
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().workspaces).toEqual([]);
    expect(useAuthStore.getState().activeWorkspace).toBeNull();
    expect(pushMock).toHaveBeenCalledWith('/auth?logout=1');
  });
});
