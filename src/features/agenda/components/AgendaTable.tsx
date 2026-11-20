'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { AppointmentResponse } from '@/api/index.schemas';
import {
  useUpdateAppointmentStatus,
  getListAppointmentsQueryKey,
} from '@/api/appointments/appointments';
import { formatTimeHHmm, formatCurrencyBRL } from '../utils/formatters';
import styles from '../styles/AgendaTable.module.css';

interface AgendaTableProps {
  appointments: AppointmentResponse[];
  isLoading?: boolean;
  onNewAppointment?: () => void;
}

export function AgendaTable({ appointments, isLoading, onNewAppointment }: AgendaTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const updateStatusMutation = useUpdateAppointmentStatus();

  const handleStartExam = async (appointment: AppointmentResponse) => {
    try {
      setUpdatingId(appointment.id);
      await updateStatusMutation.mutateAsync({
        id: appointment.id,
        data: { exam_status: 'IN_PROGRESS' },
      });
      await queryClient.invalidateQueries({
        queryKey: getListAppointmentsQueryKey(),
      });
      setFeedbackMessage(`Exame de ${appointment.patientName} iniciado com sucesso!`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch {
      setFeedbackMessage(`Erro ao iniciar exame de ${appointment.patientName}.`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleContextAction = (
    appointment: AppointmentResponse,
    actionType: 'CONTINUE' | 'VIEW_PDF' | 'TYPE_REPORT',
  ) => {
    if (actionType === 'CONTINUE' || actionType === 'TYPE_REPORT' || actionType === 'VIEW_PDF') {
      router.push(`/reports/${appointment.id}`);
    }
  };

  const renderExamStatusBadge = (status: AppointmentResponse['examStatus']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className={`${styles.statusBadge} ${styles.badgeRealizado}`}>Exame Realizado</span>
        );
      case 'IN_PROGRESS':
        return <span className={`${styles.statusBadge} ${styles.badgePendente}`}>Em Exame</span>;
      case 'SCHEDULED':
        return (
          <span className={`${styles.statusBadge} ${styles.badgeAguardando}`}>
            Aguardando Exame
          </span>
        );
      case 'CANCELLED':
        return <span className={`${styles.statusBadge} ${styles.badgeAguardando}`}>Cancelado</span>;
      default:
        return <span className={`${styles.statusBadge} ${styles.badgeAguardando}`}>{status}</span>;
    }
  };

  const renderReportStatusBadge = (status: AppointmentResponse['reportStatus']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className={`${styles.statusBadge} ${styles.badgeConcluido}`}>Laudo Concluído</span>
        );
      case 'DRAFT':
      case 'PENDING':
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.badgePendente}`}>Laudo Pendente</span>
        );
    }
  };

  const renderFinanceTag = (appointment: AppointmentResponse) => {
    const priceFormatted =
      appointment.price != null && !isNaN(Number(appointment.price))
        ? formatCurrencyBRL(Number(appointment.price))
        : null;

    if (appointment.paymentStatus === 'PAID') {
      return (
        <span className={`${styles.payTag} ${styles.payPaid}`}>
          PAGO{priceFormatted ? ` (${priceFormatted})` : ''}
        </span>
      );
    }

    if (appointment.paymentStatus === 'UNPAID') {
      return (
        <span className={`${styles.payTag} ${styles.payUnpaid}`}>
          NÃO PAGO{priceFormatted ? ` (${priceFormatted})` : ''}
        </span>
      );
    }

    if (appointment.paymentStatus === 'INSURANCE') {
      return (
        <span className={`${styles.payTag} ${styles.payInsurance}`}>
          Convênio{priceFormatted ? `: ${priceFormatted}` : ''}
        </span>
      );
    }

    return (
      <span className={`${styles.payTag} ${styles.payInsurance}`}>
        {priceFormatted || 'A Combinar'}
      </span>
    );
  };

  const renderActionButton = (appointment: AppointmentResponse) => {
    const isThisUpdating = updatingId === appointment.id;

    // 1. Se o laudo já está concluído: Ver PDF
    if (appointment.reportStatus === 'COMPLETED') {
      return (
        <button
          type="button"
          onClick={() => handleContextAction(appointment, 'VIEW_PDF')}
          className={`${styles.btnAction} ${styles.btnView}`}
        >
          Ver PDF
        </button>
      );
    }

    // 2. Se o exame foi concluído mas o laudo está pendente: Digitar Laudo
    if (appointment.examStatus === 'COMPLETED') {
      return (
        <button
          type="button"
          onClick={() => handleContextAction(appointment, 'TYPE_REPORT')}
          className={`${styles.btnAction} ${styles.btnStart}`}
        >
          Digitar Laudo
        </button>
      );
    }

    // 3. Se está em exame: Continuar
    if (appointment.examStatus === 'IN_PROGRESS') {
      return (
        <button
          type="button"
          onClick={() => handleContextAction(appointment, 'CONTINUE')}
          className={`${styles.btnAction} ${styles.btnStart}`}
        >
          Continuar
        </button>
      );
    }

    // 4. Se está agendado / aguardando: Iniciar
    if (appointment.examStatus === 'SCHEDULED') {
      return (
        <button
          type="button"
          disabled={isThisUpdating}
          onClick={() => handleStartExam(appointment)}
          className={`${styles.btnAction} ${styles.btnStart}`}
        >
          {isThisUpdating ? 'Iniciando...' : 'Iniciar'}
        </button>
      );
    }

    return (
      <span
        style={{ fontSize: '0.825rem', color: '#9ca3af', textAlign: 'center', display: 'block' }}
      >
        --
      </span>
    );
  };

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Agenda de atendimentos"
      className={styles.agendaList}
    >
      {feedbackMessage && (
        <div role="status" className={styles.feedbackBanner}>
          {feedbackMessage}
        </div>
      )}

      {!isLoading && appointments.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            📅
          </div>
          <div className={styles.emptyTitle}>Nenhum agendamento encontrado</div>
          <div className={styles.emptyText}>
            Não há atendimentos registrados para a data e filtros selecionados.
          </div>
          {onNewAppointment && (
            <button
              type="button"
              onClick={onNewAppointment}
              className={`${styles.btnAction} ${styles.btnStart} ${styles.btnEmptyAction}`}
            >
              + Novo Agendamento
            </button>
          )}
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.colTime}>
                Hora
              </th>
              <th scope="col">Paciente (Pet)</th>
              <th scope="col">Local / Procedimento</th>
              <th scope="col">Financeiro</th>
              <th scope="col" className={styles.colStatus}>
                Status
              </th>
              <th scope="col" className={styles.colAction}>
                Ação
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading
              ? [1, 2, 3, 4, 5].map((idx) => (
                  <tr key={idx} className={styles.skeletonRow}>
                    <td>
                      <div className={styles.skeletonBlock} style={{ width: '45px' }} />
                    </td>
                    <td>
                      <div className={styles.skeletonBlock} style={{ width: '180px' }} />
                    </td>
                    <td>
                      <div className={styles.skeletonBlock} style={{ width: '140px' }} />
                    </td>
                    <td>
                      <div className={styles.skeletonBlock} style={{ width: '120px' }} />
                    </td>
                    <td>
                      <div className={styles.skeletonBlock} style={{ width: '100px' }} />
                    </td>
                    <td>
                      <div className={styles.skeletonBlock} style={{ width: '110px' }} />
                    </td>
                  </tr>
                ))
              : appointments.map((item) => {
                  const isPendingHighlight =
                    item.examStatus === 'COMPLETED' &&
                    (item.reportStatus === 'PENDING' ||
                      item.reportStatus === 'DRAFT' ||
                      item.paymentStatus === 'UNPAID');

                  return (
                    <tr
                      key={item.id}
                      className={`${styles.dataRow} ${isPendingHighlight ? styles.rowPendingHighlight : ''}`}
                    >
                      {/* 1. Hora */}
                      <th scope="row" className={styles.time}>
                        {formatTimeHHmm(item.scheduledAt)}
                      </th>

                      {/* 2. Paciente (Pet) */}
                      <td>
                        <div className={styles.infoBlock}>
                          <span className={styles.primaryText}>
                            {item.patientName} {item.patientType ? `(${item.patientType})` : ''}
                          </span>
                          <span className={styles.secondaryText}>
                            <svg
                              className={styles.icon}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Tutor: {item.clientName}
                          </span>
                        </div>
                      </td>

                      {/* 3. Local / Procedimento */}
                      <td>
                        <div className={styles.infoBlock}>
                          <span className={styles.primaryText}>{item.procedureName}</span>
                          <span className={styles.secondaryText}>
                            <svg
                              className={styles.icon}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {item.clinicName}
                          </span>
                        </div>
                      </td>

                      {/* 4. Financeiro */}
                      <td>
                        <div className={styles.infoBlock}>{renderFinanceTag(item)}</div>
                      </td>

                      {/* 5. Status (Dois badges simultâneos) */}
                      <td>
                        <div className={styles.statusContainer}>
                          {renderExamStatusBadge(item.examStatus)}
                          {renderReportStatusBadge(item.reportStatus)}
                        </div>
                      </td>

                      {/* 6. Ação */}
                      <td className={styles.actionCell}>{renderActionButton(item)}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      )}
    </div>
  );
}
