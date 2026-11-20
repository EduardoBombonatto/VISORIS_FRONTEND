'use client';

import React, { useMemo } from 'react';
import type { AppointmentResponse } from '@/api/index.schemas';
import { formatCurrencyBRL } from '../utils/formatters';
import styles from '../styles/AgendaMetrics.module.css';

interface AgendaMetricsProps {
  appointments: AppointmentResponse[];
  isLoading?: boolean;
}

export function AgendaMetrics({ appointments, isLoading }: AgendaMetricsProps) {
  const metrics = useMemo(() => {
    const total = appointments.length;
    let examesRealizados = 0;
    let laudosPendentes = 0;
    let laudosConcluidos = 0;
    let recebimentosPendentes = 0;

    for (const a of appointments) {
      if (a.examStatus === 'COMPLETED') {
        examesRealizados += 1;
      }
      if (
        a.reportStatus === 'PENDING' ||
        a.reportStatus === 'DRAFT' ||
        (!a.reportStatus && a.examStatus !== 'CANCELLED')
      ) {
        laudosPendentes += 1;
      }
      if (a.reportStatus === 'COMPLETED') {
        laudosConcluidos += 1;
      }
      if (a.paymentStatus === 'UNPAID') {
        recebimentosPendentes += a.price ? Number(a.price) : 0;
      }
    }

    return {
      total,
      examesRealizados,
      laudosPendentes,
      laudosConcluidos,
      recebimentosPendentes,
    };
  }, [appointments]);

  const formattedPendentes =
    metrics.recebimentosPendentes % 1 === 0
      ? `R$ ${metrics.recebimentosPendentes}`
      : formatCurrencyBRL(metrics.recebimentosPendentes);

  return (
    <div className={styles.statsGrid}>
      {/* 1. Exames Hoje */}
      <div className={styles.statCard}>
        <div className={styles.statTitle}>Exames Hoje</div>
        <div className={styles.statValue}>
          {isLoading ? (
            '...'
          ) : (
            <>
              {metrics.examesRealizados}{' '}
              <span className={styles.statSub}>/ {metrics.total} Agendados</span>
            </>
          )}
        </div>
      </div>

      {/* 2. Laudos Pendentes */}
      <div className={styles.statCard}>
        <div className={styles.statTitle}>Laudos Pendentes</div>
        <div className={`${styles.statValue} ${styles.valueAmber}`}>
          {isLoading ? '...' : metrics.laudosPendentes}
        </div>
      </div>

      {/* 3. Laudos Concluídos */}
      <div className={styles.statCard}>
        <div className={styles.statTitle}>Laudos Concluídos</div>
        <div className={`${styles.statValue} ${styles.valueEmerald}`}>
          {isLoading ? '...' : metrics.laudosConcluidos}
        </div>
      </div>

      {/* 4. Recebimentos Pendentes */}
      <div className={`${styles.statCard} ${styles.cardPendingPayments}`}>
        <div className={styles.statTitle}>Recebimentos Pendentes</div>
        <div className={`${styles.statValue} ${styles.valueRed}`}>
          {isLoading ? '...' : formattedPendentes}
        </div>
      </div>
    </div>
  );
}
