import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import WorkspaceSelection from './WorkspaceSelection';
import { useAuthStore } from '@/store/auth-store';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('@/api/auth/auth', () => ({
  useAuthSelectWorkspace: vi.fn(),
}));

import { useAuthSelectWorkspace } from '@/api/auth/auth';

const mutate = vi.fn();

beforeEach(() => {
  mutate.mockReset();
  replaceMock.mockReset();
  vi.mocked(useAuthSelectWorkspace).mockReturnValue({
    mutate,
    isPending: false,
  } as never);
  useAuthStore.setState({
    user: { id: '1', fullName: 'Dra. Maria Souza', professionalDocument: null },
    workspaces: [
      { clinicId: '10', name: 'Clínica A', role: 'DOCTOR' },
      { clinicId: '20', name: 'Clínica B', role: 'OWNER' },
    ],
    activeWorkspace: null,
  });
});

describe('WorkspaceSelection', () => {
  it('renderiza todos os workspaces como cards', () => {
    render(<WorkspaceSelection />);
    expect(screen.getByText('Clínica A')).toBeInTheDocument();
    expect(screen.getByText('Clínica B')).toBeInTheDocument();
  });

  it('chama a mutação com clinicId ao clicar em um card', () => {
    render(<WorkspaceSelection />);
    fireEvent.click(screen.getByText('Clínica A'));
    expect(mutate).toHaveBeenCalledWith(
      { data: { clinicId: '10' } },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('em sucesso define a clínica ativa e redireciona para /dashboard', () => {
    render(<WorkspaceSelection />);
    fireEvent.click(screen.getByText('Clínica A'));

    const options = mutate.mock.calls[0][1];
    options.onSuccess({
      data: { data: { activeWorkspace: { clinicId: '10', name: 'Clínica A', role: 'DOCTOR' } } },
    });

    expect(useAuthStore.getState().activeWorkspace).toEqual({
      clinicId: '10',
      name: 'Clínica A',
      role: 'DOCTOR',
    });
    expect(replaceMock).toHaveBeenCalledWith('/dashboard');
  });

  it('em erro exibe alerta e permanece na tela', async () => {
    render(<WorkspaceSelection />);
    fireEvent.click(screen.getByText('Clínica A'));

    const options = mutate.mock.calls[0][1];
    options.onError(new Error('Serviço indisponível.'));

    expect(await screen.findByText('Serviço indisponível.')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('marca a clínica ativa como "Atual"', () => {
    useAuthStore.setState({
      user: { id: '1', fullName: 'Dra. Maria Souza', professionalDocument: null },
      workspaces: [
        { clinicId: '10', name: 'Clínica A', role: 'DOCTOR' },
        { clinicId: '20', name: 'Clínica B', role: 'OWNER' },
      ],
      activeWorkspace: { clinicId: '20', name: 'Clínica B', role: 'OWNER' },
    });

    render(<WorkspaceSelection />);

    expect(screen.getByText('Atual')).toBeInTheDocument();
    expect(screen.getByText('Clínica B').closest('button')).toHaveClass(/cardActive/);
  });

  it('clicar na clínica ativa volta ao painel sem chamar a mutação', () => {
    useAuthStore.setState({
      user: { id: '1', fullName: 'Dra. Maria Souza', professionalDocument: null },
      workspaces: [
        { clinicId: '10', name: 'Clínica A', role: 'DOCTOR' },
        { clinicId: '20', name: 'Clínica B', role: 'OWNER' },
      ],
      activeWorkspace: { clinicId: '20', name: 'Clínica B', role: 'OWNER' },
    });

    render(<WorkspaceSelection />);
    fireEvent.click(screen.getByText('Clínica B'));

    expect(mutate).not.toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith('/dashboard');
  });

  it('exibe botão de voltar ao painel quando há clínica ativa', () => {
    useAuthStore.setState({
      user: { id: '1', fullName: 'Dra. Maria Souza', professionalDocument: null },
      workspaces: [
        { clinicId: '10', name: 'Clínica A', role: 'DOCTOR' },
        { clinicId: '20', name: 'Clínica B', role: 'OWNER' },
      ],
      activeWorkspace: { clinicId: '20', name: 'Clínica B', role: 'OWNER' },
    });

    render(<WorkspaceSelection />);

    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao painel' }));
    expect(replaceMock).toHaveBeenCalledWith('/dashboard');
  });
});
