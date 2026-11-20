import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AgendaMetrics } from './AgendaMetrics';
import type { AppointmentResponse } from '@/api/index.schemas';

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

describe('AgendaMetrics Component', () => {
  it('renderiza os 4 cards calculando corretamente as métricas do mockup', () => {
    render(<AgendaMetrics appointments={mockAppointments} />);

    // Card 1: Exames Hoje (2 concluídos de 3 agendados)
    expect(screen.getByText('Exames Hoje')).toBeInTheDocument();
    expect(screen.getByText(/\/ 3 Agendados/)).toBeInTheDocument();

    // Card 2: Laudos Pendentes (2 pendentes)
    expect(screen.getByText('Laudos Pendentes')).toBeInTheDocument();
    const twos = screen.getAllByText('2');
    expect(twos.length).toBeGreaterThanOrEqual(1);

    // Card 3: Laudos Concluídos (1 concluído)
    expect(screen.getByText('Laudos Concluídos')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    // Card 4: Recebimentos Pendentes (R$ 450 não pago)
    expect(screen.getByText('Recebimentos Pendentes')).toBeInTheDocument();
    expect(screen.getByText('R$ 450')).toBeInTheDocument();
  });

  it('exibe indicador de loading quando isLoading for verdadeiro', () => {
    render(<AgendaMetrics appointments={mockAppointments} isLoading={true} />);
    const loadingIndicators = screen.getAllByText('...');
    expect(loadingIndicators).toHaveLength(4);
  });

  it('renderiza zeros de forma amigável quando lista de agendamentos estiver vazia', () => {
    render(<AgendaMetrics appointments={[]} />);
    expect(screen.getByText(/\/ 0 Agendados/)).toBeInTheDocument();
    expect(screen.getByText('R$ 0')).toBeInTheDocument();
  });
});
