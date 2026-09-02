import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import ClinicForm from './ClinicForm';

vi.mock('@/api/clinics/clinics', () => ({
  useClinicsCreate: vi.fn(),
  getClinicsListQueryKey: () => ['/api/v1/clinics'],
}));

import { useClinicsCreate } from '@/api/clinics/clinics';
import { ApiError } from '@/lib/axios';

const mutate = vi.fn();

type MutationOptions = {
  mutation?: {
    onSuccess?: (data: unknown) => void;
    onError?: (error: ApiError) => void;
  };
};

let latestOptions: MutationOptions = {};

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  vi.mocked(useClinicsCreate).mockImplementation(((options?: unknown) => {
    latestOptions = (options as MutationOptions | undefined) ?? {};
    return { mutate, isPending: false };
  }) as never);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const onClose = vi.fn();
  const onSuccess = vi.fn();

  const utils = render(<ClinicForm onClose={onClose} onSuccess={onSuccess} />, { wrapper });

  return { onClose, onSuccess, invalidateSpy, queryClient, ...utils };
}

async function submitValidForm() {
  const utils = renderForm();
  fireEvent.change(screen.getByLabelText('Nome da Clínica'), {
    target: { value: 'Clínica Vida' },
  });
  fireEvent.change(screen.getByLabelText('CNPJ'), {
    target: { value: '11.444.777/0001-61' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
  return utils;
}

beforeEach(() => {
  mutate.mockReset();
  latestOptions = {};
});

describe('ClinicForm', () => {
  it('chama onClose ao clicar em Cancelar', () => {
    const { onClose } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('bloqueia envio com erros sob o campo quando o formulário está inválido', async () => {
    const { invalidateSpy } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('O nome deve ter no mínimo 2 caracteres')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('envia a mutation com o corpo mapeado', async () => {
    await submitValidForm();
    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        data: {
          name: 'Clínica Vida',
          cnpj: '11444777000161',
          phone: null,
          address: null,
        },
      });
    });
  });

  it('invalida a query da lista e dispara onSuccess ao ter sucesso', async () => {
    const { invalidateSpy, onSuccess } = await submitValidForm();

    latestOptions.mutation?.onSuccess?.({ status: 201, data: { clinic: {} } });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['/api/v1/clinics'],
      });
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('mapeia erros de campo do servidor para o formulário', async () => {
    const utils = await submitValidForm();
    await waitFor(() => expect(mutate).toHaveBeenCalled());

    act(() => {
      latestOptions.mutation?.onError?.(
        new ApiError('Dados inválidos.', 400, [{ field: 'name', message: 'Nome inválido.' }]),
      );
    });

    expect(await screen.findByText('Nome inválido.')).toBeInTheDocument();
    expect(utils.onClose).not.toHaveBeenCalled();
  });

  it('exibe erro global quando não há fieldErrors e preserva os dados', async () => {
    const utils = await submitValidForm();
    await waitFor(() => expect(mutate).toHaveBeenCalled());

    act(() => {
      latestOptions.mutation?.onError?.(new ApiError('Serviço indisponível.', 0, []));
    });

    expect(await screen.findByText('Serviço indisponível.')).toBeInTheDocument();
    expect(utils.onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Nome da Clínica')).toHaveValue('Clínica Vida');
  });

  it('mantém o botão com loading durante o envio', () => {
    const queryClient = new QueryClient();
    vi.mocked(useClinicsCreate).mockReturnValue({ mutate, isPending: true } as never);
    render(
      <QueryClientProvider client={queryClient}>
        <ClinicForm onClose={vi.fn()} />
      </QueryClientProvider>,
    );
    const spinner = screen.getByRole('status', { name: 'Carregando' });
    expect(spinner.closest('button')).toBeDisabled();
  });
});
