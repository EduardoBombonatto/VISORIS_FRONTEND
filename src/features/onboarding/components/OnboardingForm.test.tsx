import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import OnboardingForm from './OnboardingForm';
import { useAuthStore } from '@/store/auth-store';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('../api/create-workspace', () => ({
  useCreateWorkspace: vi.fn(),
}));

import { useCreateWorkspace } from '../api/create-workspace';

const mutate = vi.fn();

beforeEach(() => {
  mutate.mockReset();
  replaceMock.mockReset();
  vi.mocked(useCreateWorkspace).mockReturnValue({
    mutate,
    isPending: false,
  } as never);
  useAuthStore.setState({ user: null, workspaces: [], activeWorkspace: null });
});

describe('OnboardingForm', () => {
  it('exibe erro sob o campo ao submeter vazio e não chama a mutação', async () => {
    render(<OnboardingForm />);

    fireEvent.click(screen.getByRole('button', { name: /criar clínica/i }));

    expect(await screen.findByText('Nome da clínica é obrigatório.')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('desabilita o botão durante o carregamento', () => {
    vi.mocked(useCreateWorkspace).mockReturnValue({
      mutate,
      isPending: true,
    } as never);

    render(<OnboardingForm />);

    expect(screen.getByRole('button', { name: /carregando/i })).toBeDisabled();
  });

  it('em sucesso adiciona o workspace, define como ativo e redireciona para /dashboard', async () => {
    render(<OnboardingForm />);

    fireEvent.change(screen.getByLabelText('Nome da Clínica'), {
      target: { value: 'Clínica Visoris' },
    });
    fireEvent.click(screen.getByRole('button', { name: /criar clínica/i }));

    await vi.waitFor(() => {
      expect(mutate).toHaveBeenCalled();
    });

    expect(mutate).toHaveBeenCalledWith(
      { name: 'Clínica Visoris' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );

    const options = mutate.mock.calls[0][1];
    options.onSuccess({ clinicId: '1', name: 'Clínica Visoris', role: 'OWNER' });

    expect(useAuthStore.getState().workspaces).toEqual([
      { clinicId: '1', name: 'Clínica Visoris', role: 'OWNER' },
    ]);
    expect(useAuthStore.getState().activeWorkspace).toEqual({
      clinicId: '1',
      name: 'Clínica Visoris',
      role: 'OWNER',
    });
    expect(replaceMock).toHaveBeenCalledWith('/dashboard');
  });
});
