import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    expect(screen.getByText('Documento profissional é obrigatório.')).toBeInTheDocument();
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

    fireEvent.change(screen.getByPlaceholderText('00000-SP'), {
      target: { value: '123456-SP' },
    });

    expect(screen.getByLabelText('Contém números: atendido')).toBeInTheDocument();
    expect(screen.getByLabelText('Contém a UF (ex: SP): atendido')).toBeInTheDocument();
  });

  it('troca o tipo de documento entre CRM e CRMV', () => {
    render(<RegisterForm />);

    expect(screen.getByRole('radio', { name: 'CRM' })).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: 'CRMV' }));

    expect(screen.getByRole('radio', { name: 'CRMV' })).toBeChecked();
    expect(screen.getByLabelText('CRMV', { selector: 'input[type="text"]' })).toBeInTheDocument();
  });

  it('envia o documento com o tipo selecionado prefixado', async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText('Nome Completo'), {
      target: { value: 'Dr. João Silva' },
    });
    fireEvent.change(screen.getByPlaceholderText('00000-SP'), {
      target: { value: '123456-SP' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'dr@clinica.com.br' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'Senha@123' },
    });

    fireEvent.click(screen.getByRole('radio', { name: 'CRMV' }));
    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.click(screen.getByRole('button', { name: 'Criar Conta e Iniciar Teste' }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: {
          fullName: 'Dr. João Silva',
          email: 'dr@clinica.com.br',
          password: 'Senha@123',
          professionalDocument: 'CRMV/123456-SP',
        },
      });
    });
  });
});
