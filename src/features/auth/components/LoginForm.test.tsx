import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LoginForm from './LoginForm';

vi.mock('@/api/auth/auth', () => ({
  useAuthLogin: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { useAuthLogin } from '@/api/auth/auth';

const mutate = vi.fn();

beforeEach(() => {
  mutate.mockReset();
  vi.mocked(useAuthLogin).mockReturnValue({
    mutate,
    isPending: false,
  } as never);
});

describe('LoginForm', () => {
  it('exibe erros por campo ao submeter vazio e não chama a mutação', async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Acessar Sistema' }));

    expect(await screen.findByText('E-mail é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('Senha é obrigatória.')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('desabilita o botão durante o carregamento', () => {
    vi.mocked(useAuthLogin).mockReturnValue({
      mutate,
      isPending: true,
    } as never);

    render(<LoginForm />);

    expect(screen.getByRole('button', { name: /carregando/i })).toBeDisabled();
  });
});
