import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgendaTable } from './AgendaTable';
import type { AppointmentResponse } from '@/api/index.schemas';

// Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock mutation hook
const mutateAsyncMock = vi.fn().mockResolvedValue({});
vi.mock('@/api/appointments/appointments', () => ({
  useUpdateAppointmentStatus: () => ({
    mutateAsync: mutateAsyncMock,
  }),
  getListAppointmentsQueryKey: () => ['appointments'],
}));

const mockAppointments: AppointmentResponse[] = [
  {
    id: '1',
    userId: 'u1',
    clinicId: 'c1',
    patientId: 'p1',
    scheduledAt: '2026-07-15T08:00:00Z',
    procedureName: 'Endoscopia Digestiva',
    examStatus: 'COMPLETED',
    reportStatus: 'COMPLETED',
    paymentStatus: 'PAID',
    price: 350,
    createdAt: '2026-07-15T08:00:00Z',
    updatedAt: '2026-07-15T08:00:00Z',
    patientName: 'Bidu',
    patientType: 'Canino, Poodle',
    clientName: 'Carlos Silva',
    clinicName: 'Clínica Vet Vida',
  },
  {
    id: '2',
    userId: 'u1',
    clinicId: 'c2',
    patientId: 'p2',
    scheduledAt: '2026-07-15T10:30:00Z',
    procedureName: 'Ultrassom Abdominal',
    examStatus: 'COMPLETED',
    reportStatus: 'PENDING',
    paymentStatus: 'UNPAID',
    price: 450,
    createdAt: '2026-07-15T10:30:00Z',
    updatedAt: '2026-07-15T10:30:00Z',
    patientName: 'Chilli',
    patientType: 'Felino, SRD',
    clientName: 'Ana Beatriz',
    clinicName: 'Hospital Animal Care',
  },
  {
    id: '3',
    userId: 'u1',
    clinicId: 'c1',
    patientId: 'p3',
    scheduledAt: '2026-07-15T14:00:00Z',
    procedureName: 'Endoscopia Respiratória',
    examStatus: 'SCHEDULED',
    reportStatus: 'PENDING',
    paymentStatus: 'INSURANCE',
    price: null,
    createdAt: '2026-07-15T14:00:00Z',
    updatedAt: '2026-07-15T14:00:00Z',
    patientName: 'Thor',
    patientType: 'Canino, Golden',
    clientName: 'Marcos',
    clinicName: 'Clínica Vet Vida',
  },
];

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('AgendaTable Component', () => {
  it('renderiza os cabeçalhos das 6 colunas do mockup', () => {
    renderWithQueryClient(<AgendaTable appointments={mockAppointments} />);

    expect(screen.getByText('Hora')).toBeInTheDocument();
    expect(screen.getByText('Paciente (Pet)')).toBeInTheDocument();
    expect(screen.getByText('Local / Procedimento')).toBeInTheDocument();
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Ação')).toBeInTheDocument();
  });

  it('renderiza os dados de pacientes, tutores, clínicas e procedimentos', () => {
    renderWithQueryClient(<AgendaTable appointments={mockAppointments} />);

    // Paciente 1
    expect(screen.getByText('Bidu (Canino, Poodle)')).toBeInTheDocument();
    expect(screen.getByText(/Tutor: Carlos Silva/)).toBeInTheDocument();
    expect(screen.getByText('Endoscopia Digestiva')).toBeInTheDocument();
    expect(screen.getAllByText('Clínica Vet Vida').length).toBeGreaterThanOrEqual(1);

    // Paciente 2
    expect(screen.getByText('Chilli (Felino, SRD)')).toBeInTheDocument();
    expect(screen.getByText(/Tutor: Ana Beatriz/)).toBeInTheDocument();
    expect(screen.getByText('Ultrassom Abdominal')).toBeInTheDocument();
    expect(screen.getByText('Hospital Animal Care')).toBeInTheDocument();
  });

  it('renderiza as tags financeiras estilizadas de PAGO, NÃO PAGO e Convênio', () => {
    renderWithQueryClient(<AgendaTable appointments={mockAppointments} />);

    expect(screen.getByText(/^PAGO/)).toBeInTheDocument();
    expect(screen.getByText(/^NÃO PAGO/)).toBeInTheDocument();
    expect(screen.getByText('Convênio')).toBeInTheDocument();
  });

  it('renderiza os badges duplos de status (exame e laudo)', () => {
    renderWithQueryClient(<AgendaTable appointments={mockAppointments} />);

    expect(screen.getAllByText('Exame Realizado').length).toBe(2);
    expect(screen.getByText('Aguardando Exame')).toBeInTheDocument();
    expect(screen.getByText('Laudo Concluído')).toBeInTheDocument();
    expect(screen.getAllByText('Laudo Pendente').length).toBe(2);
  });

  it('renderiza botões contextuais corretos e dispara Iniciar Exame', async () => {
    renderWithQueryClient(<AgendaTable appointments={mockAppointments} />);

    // Paciente 1 (concluído): Ver PDF
    expect(screen.getByText('Ver PDF')).toBeInTheDocument();

    // Paciente 2 (exame feito, laudo pendente): Digitar Laudo
    expect(screen.getByText('Digitar Laudo')).toBeInTheDocument();

    // Paciente 3 (aguardando): Iniciar
    const btnIniciar = screen.getByText('Iniciar');
    expect(btnIniciar).toBeInTheDocument();

    fireEvent.click(btnIniciar);
    expect(mutateAsyncMock).toHaveBeenCalledWith({
      id: '3',
      data: { exam_status: 'IN_PROGRESS' },
    });
  });

  it('navega para /reports/[appointmentId] ao clicar em Digitar Laudo, Continuar ou Ver PDF', () => {
    pushMock.mockClear();
    renderWithQueryClient(<AgendaTable appointments={mockAppointments} />);

    fireEvent.click(screen.getByText('Digitar Laudo'));
    expect(pushMock).toHaveBeenCalledWith('/reports/2');

    fireEvent.click(screen.getByText('Ver PDF'));
    expect(pushMock).toHaveBeenCalledWith('/reports/1');
  });

  it('renderiza empty state amigável quando a lista estiver vazia', () => {
    const onNewAppointment = vi.fn();
    renderWithQueryClient(<AgendaTable appointments={[]} onNewAppointment={onNewAppointment} />);

    expect(screen.getByText('Nenhum agendamento encontrado')).toBeInTheDocument();
    const btnNew = screen.getByText('+ Novo Agendamento');
    fireEvent.click(btnNew);
    expect(onNewAppointment).toHaveBeenCalled();
  });
});
