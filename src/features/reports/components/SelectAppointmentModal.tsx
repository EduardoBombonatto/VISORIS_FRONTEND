'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useListAppointments } from '@/api/appointments/appointments';
import type { AppointmentResponse } from '@/api/index.schemas';
import Modal from '@/components/ui/Modal';
import {
  extractAppointmentsList,
  formatTimeHHmm,
  getDayRangeISO,
} from '@/features/agenda/utils/formatters';
import styles from './SelectAppointmentModal.module.css';

export interface SelectAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  inline?: boolean;
}

function getWideDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setDate(end.getDate() + 30);
  end.setHours(23, 59, 59, 999);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export default function SelectAppointmentModal({
  isOpen,
  onClose,
  inline = false,
}: SelectAppointmentModalProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { startDate, endDate } = useMemo(() => {
    if (dateFilter) {
      const [year, month, day] = dateFilter.split('-').map(Number);
      return getDayRangeISO(new Date(year, month - 1, day, 12, 0, 0));
    }
    return getWideDateRange();
  }, [dateFilter]);

  const { data: appointmentsData, isLoading } = useListAppointments(
    { startDate, endDate },
    {
      query: {
        enabled: isOpen || inline,
      },
    },
  );

  const appointments: AppointmentResponse[] = useMemo(() => {
    const all = extractAppointmentsList(appointmentsData);
    const term = searchTerm.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (appt) =>
        appt.patientName.toLowerCase().includes(term) ||
        appt.procedureName.toLowerCase().includes(term) ||
        appt.clinicName.toLowerCase().includes(term),
    );
  }, [appointmentsData, searchTerm]);

  const handleSelectAppointment = (appointmentId: string) => {
    onClose();
    router.push(`/reports/${appointmentId}`);
  };

  const renderStatusBadge = (reportStatus: AppointmentResponse['reportStatus']) => {
    switch (reportStatus) {
      case 'COMPLETED':
        return <span className={`${styles.badgeStatus} ${styles.statusCompleted}`}>Concluído</span>;
      case 'DRAFT':
        return <span className={`${styles.badgeStatus} ${styles.statusDraft}`}>Em Rascunho</span>;
      case 'PENDING':
      default:
        return <span className={`${styles.badgeStatus} ${styles.statusPending}`}>Pendente</span>;
    }
  };

  const getActionLabel = (reportStatus: AppointmentResponse['reportStatus']) => {
    if (reportStatus === 'COMPLETED') return 'Ver Laudo';
    if (reportStatus === 'DRAFT') return 'Continuar Laudo';
    return 'Digitar Laudo';
  };

  const content = (
    <div className={styles.container}>
      <p className={styles.description}>
        Selecione um atendimento agendado para redigir, continuar ou consultar o laudo médico na
        Folha A4:
      </p>

      <div className={styles.filtersRow}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Buscar por paciente, procedimento ou clínica..."
          aria-label="Buscar agendamento para laudo"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          type="date"
          className={styles.dateInput}
          aria-label="Filtrar por data"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      <div className={styles.list} role="list" aria-label="Lista de agendamentos para laudo">
        {isLoading ? (
          <div className={styles.emptyState}>Carregando agendamentos...</div>
        ) : appointments.length === 0 ? (
          <div className={styles.emptyState}>
            Nenhum agendamento encontrado para o filtro selecionado.
          </div>
        ) : (
          appointments.map((appt) => (
            <div key={appt.id} className={styles.itemCard} role="listitem">
              <div className={styles.itemInfo}>
                <div className={styles.patientRow}>
                  <span className={styles.patientName}>{appt.patientName}</span>
                  {renderStatusBadge(appt.reportStatus)}
                </div>
                <span className={styles.metaText}>
                  {appt.procedureName} • {appt.clinicName} • {formatTimeHHmm(appt.scheduledAt)}
                </span>
              </div>

              <button
                type="button"
                className={styles.btnSelect}
                onClick={() => handleSelectAppointment(appt.id)}
              >
                {getActionLabel(appt.reportStatus)}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Selecionar Atendimento — Laudos">
      {content}
    </Modal>
  );
}
