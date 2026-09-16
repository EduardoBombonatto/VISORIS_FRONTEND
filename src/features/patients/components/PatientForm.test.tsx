import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PatientForm } from './PatientForm';

vi.mock('@/api/clients/clients', () => ({
  useClientsCreate: vi.fn(),
  getClientsListQueryKey: () => ['/api/v1/clients'],
}));

vi.mock('@/api/patients/patients', () => ({
  usePatientsCreate: vi.fn(),
  getPatientsListQueryKey: () => ['/api/v1/patients'],
}));

import { useClientsCreate } from '@/api/clients/clients';
import { usePatientsCreate } from '@/api/patients/patients';

const mutateClientAsync = vi.fn();
const mutatePatientAsync = vi.fn();

beforeEach(() => {
  mutateClientAsync.mockReset();
  mutatePatientAsync.mockReset();

  vi.mocked(useClientsCreate).mockReturnValue({
    mutateAsync: mutateClientAsync,
  } as never);

  vi.mocked(usePatientsCreate).mockReturnValue({
    mutateAsync: mutatePatientAsync,
  } as never);
});

function renderForm(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const onSuccess = vi.fn();
  const onCancel = vi.fn();

  const utils = render(<PatientForm onSuccess={onSuccess} onCancel={onCancel} {...props} />, {
    wrapper,
  });

  return { onSuccess, onCancel, ...utils };
}

describe('PatientForm', () => {
  it('renderiza os campos específicos de pets e tutores por padrão', () => {
    renderForm();

    expect(screen.getByText('Dados do Tutor')).toBeInTheDocument();
    expect(screen.getByText('Dados do Pet')).toBeInTheDocument();
    expect(screen.getByLabelText(/Espécie/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do Pet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data de Nascimento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ou Idade aproximada/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Raça/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cor da pelagem/i)).toBeInTheDocument();
  });

  it('exibe mensagens de validação ao submeter formulário vazio', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Cadastro' }));

    expect(await screen.findByText('Nome do tutor é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('E-mail inválido')).toBeInTheDocument();
    expect(screen.getByText('Espécie é obrigatória')).toBeInTheDocument();
    expect(screen.getByText('Nome do pet é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Informe a data de nascimento ou a idade do pet')).toBeInTheDocument();
    expect(screen.getByText('Raça é obrigatória')).toBeInTheDocument();
    expect(screen.getByText('Cor da pelagem é obrigatória')).toBeInTheDocument();
  });

  it('calcula a idade automaticamente ao selecionar data de nascimento', () => {
    renderForm();

    const birthDateInput = screen.getByLabelText(/Data de Nascimento/i);
    fireEvent.change(birthDateInput, { target: { value: '2020-01-15' } });

    const ageInput = screen.getByLabelText(/Ou Idade aproximada/i);
    expect((ageInput as HTMLInputElement).value).toMatch(/\d+ anos/);
  });

  it('quando existingClientId é fornecido, oculta dados do tutor e cadastra apenas o pet', async () => {
    mutatePatientAsync.mockResolvedValueOnce({
      data: { data: { patient: { id: '999' } } },
    });

    const { onSuccess } = renderForm({
      existingClientId: '12345',
      existingClientName: 'Maria Silva',
    });

    expect(screen.queryByText('Dados do Tutor')).not.toBeInTheDocument();
    expect(screen.getByText(/Cadastrando pet/)).toBeInTheDocument();
    expect(screen.getByText(/Maria Silva/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Espécie/i), { target: { value: 'Canino' } });
    fireEvent.change(screen.getByLabelText(/Nome do Pet/i), { target: { value: 'Thor' } });
    fireEvent.change(screen.getByLabelText(/Ou Idade aproximada/i), {
      target: { value: '2 anos' },
    });
    fireEvent.change(screen.getByLabelText(/Raça/i), { target: { value: 'Pitbull' } });
    fireEvent.change(screen.getByLabelText(/Cor da pelagem/i), { target: { value: 'Marrom' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Cadastro' }));

    await waitFor(() => {
      expect(mutateClientAsync).not.toHaveBeenCalled();
      expect(mutatePatientAsync).toHaveBeenCalledWith({
        data: expect.objectContaining({
          client_id: '12345',
          name: 'Thor',
          patient_type: 'PET',
          biological_details: {
            species: 'Canino',
            breed: 'Pitbull',
            coat_color: 'Marrom',
            age: '2 anos',
          },
        }),
      });
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('cadastra tutor e pet enviando patient_type: PET', async () => {
    mutateClientAsync.mockResolvedValueOnce({
      data: { data: { id: '777' } },
    });
    mutatePatientAsync.mockResolvedValueOnce({
      data: { data: { patient: { id: '888' } } },
    });

    const { onSuccess } = renderForm();

    fireEvent.change(screen.getByPlaceholderText('Ex: Carlos Silva'), {
      target: { value: 'Carlos Pereira' },
    });
    fireEvent.change(screen.getByPlaceholderText('tutor@exemplo.com'), {
      target: { value: 'carlos@teste.com' },
    });

    fireEvent.change(screen.getByLabelText(/Espécie/i), { target: { value: 'Felino' } });
    fireEvent.change(screen.getByLabelText(/Nome do Pet/i), { target: { value: 'Mimi' } });
    fireEvent.change(screen.getByLabelText(/Data de Nascimento/i), {
      target: { value: '2021-06-01' },
    });
    fireEvent.change(screen.getByLabelText(/Raça/i), { target: { value: 'Siamês' } });
    fireEvent.change(screen.getByLabelText(/Cor da pelagem/i), { target: { value: 'Branco' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Cadastro' }));

    await waitFor(() => {
      expect(mutateClientAsync).toHaveBeenCalled();
      expect(mutatePatientAsync).toHaveBeenCalledWith({
        data: expect.objectContaining({
          client_id: '777',
          name: 'Mimi',
          patient_type: 'PET',
          birth_date: '2021-06-01',
          biological_details: expect.objectContaining({
            species: 'Felino',
            breed: 'Siamês',
            coat_color: 'Branco',
          }),
        }),
      });
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('permite adicionar múltiplos pets e submeter todos para o mesmo tutor', async () => {
    mutateClientAsync.mockResolvedValueOnce({
      data: { data: { id: '555' } },
    });
    mutatePatientAsync.mockResolvedValue({
      data: { data: { patient: { id: '999' } } },
    });

    const { onSuccess } = renderForm();

    fireEvent.change(screen.getByPlaceholderText('Ex: Carlos Silva'), {
      target: { value: 'Roberto Souza' },
    });
    fireEvent.change(screen.getByPlaceholderText('tutor@exemplo.com'), {
      target: { value: 'roberto@teste.com' },
    });

    // Pet 1
    fireEvent.change(screen.getByLabelText(/Espécie/i), { target: { value: 'Canino' } });
    fireEvent.change(screen.getByLabelText(/Nome do Pet/i), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText(/Ou Idade aproximada/i), {
      target: { value: '3 anos' },
    });
    fireEvent.change(screen.getByLabelText(/Raça/i), { target: { value: 'Labrador' } });
    fireEvent.change(screen.getByLabelText(/Cor da pelagem/i), { target: { value: 'Amarelo' } });

    // Adiciona Pet 2
    fireEvent.click(screen.getByRole('button', { name: '+ Adicionar outro Pet' }));

    expect(screen.getByText('Pet #2')).toBeInTheDocument();

    const speciesSelects = screen.getAllByLabelText(/Espécie/i);
    const nameInputs = screen.getAllByLabelText(/Nome do Pet/i);
    const ageInputs = screen.getAllByLabelText(/Ou Idade aproximada/i);
    const breedInputs = screen.getAllByLabelText(/Raça/i);
    const coatInputs = screen.getAllByLabelText(/Cor da pelagem/i);

    fireEvent.change(speciesSelects[1], { target: { value: 'Felino' } });
    fireEvent.change(nameInputs[1], { target: { value: 'Luna' } });
    fireEvent.change(ageInputs[1], { target: { value: '1 ano' } });
    fireEvent.change(breedInputs[1], { target: { value: 'Persa' } });
    fireEvent.change(coatInputs[1], { target: { value: 'Cinza' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Cadastro (2 pets)' }));

    await waitFor(() => {
      expect(mutateClientAsync).toHaveBeenCalled();
      expect(mutatePatientAsync).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
