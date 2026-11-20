'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useListAppointments } from '@/api/appointments/appointments';
import { useClinicsList } from '@/api/clinics/clinics';
import type { AppointmentResponse, ClinicData } from '@/api/index.schemas';
import { AgendaMetrics } from './AgendaMetrics';
import { AgendaTable } from './AgendaTable';
import { AppointmentModal } from './AppointmentModal';
import {
  formatLongDate,
  formatDateToYYYYMMDD,
  getDayRangeISO,
  extractClinicsList,
  extractAppointmentsList,
} from '../utils/formatters';
import styles from '../styles/AgendaDashboard.module.css';

export function AgendaDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedClinicId, setSelectedClinicId] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Intervalo do dia selecionado em ISO 8601
  const { startDate, endDate } = useMemo(() => {
    return getDayRangeISO(selectedDate);
  }, [selectedDate]);

  const isToday = useMemo(() => {
    return formatDateToYYYYMMDD(selectedDate) === formatDateToYYYYMMDD(new Date());
  }, [selectedDate]);

  // Consulta de agendamentos
  const { data: appointmentsData, isLoading: isLoadingAppointments } = useListAppointments(
    {
      startDate,
      endDate,
      clinicId: selectedClinicId !== 'ALL' ? selectedClinicId : undefined,
    },
    {
      query: {
        refetchInterval: 30000,
      },
    },
  );

  const appointments: AppointmentResponse[] = useMemo(() => {
    return extractAppointmentsList(appointmentsData);
  }, [appointmentsData]);

  // Consulta de Clínicas para o filtro
  const { data: clinicsData } = useClinicsList();
  const clinics: ClinicData[] = useMemo(() => {
    return extractClinicsList(clinicsData);
  }, [clinicsData]);

  // Navegação de dias
  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    setSelectedDate(new Date(year, month - 1, day, 12, 0, 0));
  };

  return (
    <div className={styles.workspace}>
      {/* Topbar Date Header */}
      <div className={styles.topbarInfo}>
        <div className={styles.topbarDate}>
          <svg
            className={styles.calendarIcon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            {isToday ? `Hoje, ${formatLongDate(selectedDate)}` : formatLongDate(selectedDate)}
          </span>
        </div>

        {/* Navegação por Data */}
        <div className={styles.dateNavGroup}>
          <button
            type="button"
            onClick={handlePrevDay}
            className={styles.dateNavBtn}
            title="Dia anterior"
            aria-label="Dia anterior"
          >
            ◀
          </button>
          <button type="button" onClick={handleToday} className={styles.dateNavBtn} title="Hoje">
            Hoje
          </button>
          <input
            type="date"
            className={styles.dateInput}
            value={formatDateToYYYYMMDD(selectedDate)}
            onChange={handleDateChange}
            aria-label="Selecionar data específica"
          />
          <button
            type="button"
            onClick={handleNextDay}
            className={styles.dateNavBtn}
            title="Próximo dia"
            aria-label="Próximo dia"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Agenda e Comandas</h1>

        <div className={styles.headerActions}>
          {/* Filtro Global de Clínica */}
          <div className={styles.clinicSelector}>
            <select
              className={styles.clinicSelect}
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              aria-label="Filtrar por Clínica"
            >
              <option value="ALL">Todas as Clínicas Hoje</option>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
            <Link href="/clinics" className={styles.btnLink}>
              Gerir
            </Link>
          </div>

          <button type="button" className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <AgendaMetrics appointments={appointments} isLoading={isLoadingAppointments} />

      {/* Tabela de Agendamentos */}
      <AgendaTable
        appointments={appointments}
        isLoading={isLoadingAppointments}
        onNewAppointment={() => setIsModalOpen(true)}
      />

      {/* Modal Novo Agendamento */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDate={formatDateToYYYYMMDD(selectedDate)}
        onSuccess={(createdDate) => {
          setIsModalOpen(false);
          if (createdDate) {
            const [year, month, day] = createdDate.split('-').map(Number);
            setSelectedDate(new Date(year, month - 1, day, 12, 0, 0));
          }
        }}
      />
    </div>
  );
}
