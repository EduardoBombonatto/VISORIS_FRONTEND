import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PatientDetail } from './PatientDetail';
import type { ClientResponse } from '@/api/index.schemas';

vi.mock('@/api/patients/patients', () => ({
  usePatientsList: vi.fn(),
  usePatientsDelete: vi.fn(),
  usePatientsUpdate: vi.fn(),
  getPatientsListQueryKey: () => ['/api/v1/patients'],
}));

vi.mock('@/api/clients/clients', () => ({
  useClientsDelete: vi.fn(),
  useClientsUpdate: vi.fn(),
  getClientsListQueryKey: () => ['/api/v1/clients'],
}));

import { usePatientsList, usePatientsDelete } from '@/api/patients/patients';
import { useClientsDelete } from '@/api/clients/clients';

const mockClient: ClientResponse = {
  id: '123',
  userId: 'user1',
  fullName: 'Ana Paula',
  documentCpf: '12345678901',
  email: 'ana@teste.com',
  phone: '11988887777',
  createdAt: '2026-08-12T10:15:30Z',
};

const mutateDeleteClient = vi.fn();
const mutateDeletePatient = vi.fn();

beforeEach(() => {
  mutateDeleteClient.mockReset();
  mutateDeletePatient.mockReset();

  vi.mocked(usePatientsList).mockReturnValue({
    data: {
      data: {
        patients: [
          {
            id: 'pet-1',
            clientId: '123',
            name: 'Rex',
            patientType: 'PET',
            birthDate: '2022-05-10',
            biologicalDetails: {
              species: 'Canino',
              breed: 'Golden Retriever',
              coat_color: 'Dourado',
              age: '2 anos',
            },
            createdAt: '2026-08-12T10:15:30Z',
          },
        ],
      },
    },
    isLoading: false,
  } as never);

  vi.mocked(useClientsDelete).mockReturnValue({
    mutateAsync: mutateDeleteClient,
  } as never);

  vi.mocked(usePatientsDelete).mockReturnValue({
    mutateAsync: mutateDeletePatient,
  } as never);
});

function renderDetail(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return render(<PatientDetail client={mockClient} {...props} />, { wrapper });
}

describe('PatientDetail', () => {
  it('exibe o nome do pet sem o sufixo (HUMAN) ou (PET)', () => {
    renderDetail();

    expect(screen.getByText('Rex')).toBeInTheDocument();
    expect(screen.queryByText(/HUMAN/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PET/i)).not.toBeInTheDocument();
  });

  it('ao clicar no pet, expande e exibe suas informações detalhadas', () => {
    renderDetail();

    // Antes de clicar, detalhes como "Golden Retriever" ou "Dourado" não estão visíveis
    expect(screen.queryByText('Golden Retriever')).not.toBeInTheDocument();
    expect(screen.queryByText('Dourado')).not.toBeInTheDocument();

    // Clica no cabeçalho do card do pet
    fireEvent.click(screen.getByText('Rex'));

    // Agora os detalhes aparecem
    expect(screen.getByText('Canino')).toBeInTheDocument();
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText('Dourado')).toBeInTheDocument();
    expect(screen.getByText('2 anos')).toBeInTheDocument();
    expect(screen.getByText('10/05/2022')).toBeInTheDocument();
  });

  it('dispara onAddPatientForClient ao clicar em Novo Paciente', () => {
    const onAddPatientForClient = vi.fn();
    renderDetail({ onAddPatientForClient });

    fireEvent.click(screen.getByRole('button', { name: 'Novo Paciente' }));

    expect(onAddPatientForClient).toHaveBeenCalledWith(mockClient);
  });

  it('renderiza os botões de ação para Editar Tutor e Excluir Tutor', () => {
    renderDetail();

    expect(screen.getByRole('button', { name: 'Editar Tutor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir Tutor' })).toBeInTheDocument();
  });

  it('renderiza os botões de ação Editar e Excluir para cada pet', () => {
    renderDetail();

    expect(screen.getByTitle('Editar este pet')).toBeInTheDocument();
    expect(screen.getByTitle('Excluir este pet')).toBeInTheDocument();
  });

  it('exibe estado vazio elegante com botão para cadastrar primeiro tutor quando não há tutores', () => {
    const onAddTutor = vi.fn();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    render(<PatientDetail client={null} hasClients={false} onAddTutor={onAddTutor} />, { wrapper });

    expect(screen.getByText('Nenhum tutor cadastrado')).toBeInTheDocument();
    expect(
      screen.getByText(/Cadastre seu primeiro tutor e paciente para começar/i),
    ).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: /Cadastrar Primeiro Tutor/i });
    expect(createButton).toBeInTheDocument();

    fireEvent.click(createButton);
    expect(onAddTutor).toHaveBeenCalledTimes(1);
  });

  it('exibe estado vazio quando há tutores mas nenhum está selecionado', () => {
    const onAddTutor = vi.fn();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    render(<PatientDetail client={null} hasClients={true} onAddTutor={onAddTutor} />, { wrapper });

    expect(screen.getByText('Nenhum tutor selecionado')).toBeInTheDocument();
    expect(
      screen.getByText(/Selecione um tutor na lista ao lado para ver os detalhes/i),
    ).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: /Novo Cadastro/i });
    expect(createButton).toBeInTheDocument();

    fireEvent.click(createButton);
    expect(onAddTutor).toHaveBeenCalledTimes(1);
  });
});
