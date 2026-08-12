import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import RegisterForm from './RegisterForm';

vi.mock('@/api/auth/auth', () => ({
  useAuthRegister: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { useAuthRegister } from '@/api/auth/auth';

const mutate = vi.fn();

beforeEach(() => {
  mutate.mockReset();
  vi.mocked(useAuthRegister).mockReturnValue({
    mutate,
    isPending: false,
  } as never);
});

describe('RegisterForm', () => {
  it('exibe erros por campo ao submeter vazio', async () => {
    render(<RegisterForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Criar Conta e Iniciar Teste' }));

    expect(await screen.findByText('Nome completo é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('CRM é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('E-mail é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('A senha deve conter pelo menos 8 caracteres.')).toBeInTheDocument();
    expect(screen.getByText('Você deve aceitar os termos de uso.')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('marca os requisitos da senha como atendidos conforme o usuário digita', () => {
    render(<RegisterForm />);

    expect(screen.getByText('8+ caracteres')).toBeInTheDocument();
    expect(screen.getByLabelText('8+ caracteres: não atendido')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'Senha@123' },
    });

    expect(screen.getByLabelText('8+ caracteres: atendido')).toBeInTheDocument();
    expect(screen.getByLabelText('Letra maiúscula: atendido')).toBeInTheDocument();
    expect(screen.getByLabelText('Letra minúscula: atendido')).toBeInTheDocument();
    expect(screen.getByLabelText('Número: atendido')).toBeInTheDocument();
    expect(screen.getByLabelText('Caractere especial: atendido')).toBeInTheDocument();
  });

  it('marca os requisitos do CRM como atendidos conforme o usuário digita', () => {
    render(<RegisterForm />);

    expect(screen.getByText('Contém números')).toBeInTheDocument();
    expect(screen.getByLabelText('Contém números: não atendido')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('CRM'), {
      target: { value: '123456-SP' },
    });

    expect(screen.getByLabelText('Contém números: atendido')).toBeInTheDocument();
    expect(screen.getByLabelText('Contém a UF (ex: SP): atendido')).toBeInTheDocument();
  });
});
