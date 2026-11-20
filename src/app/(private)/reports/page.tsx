'use client';

import React from 'react';
import SelectAppointmentModal from '@/features/reports/components/SelectAppointmentModal';
import styles from './page.module.css';

export default function ReportsIndexPage() {
  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>Central de Laudos</h1>
        <p className={styles.subtitle}>
          Selecione um atendimento da sua agenda para redigir, continuar ou visualizar o laudo na
          Folha A4.
        </p>
      </header>

      <div className={styles.card}>
        <SelectAppointmentModal isOpen={true} onClose={() => {}} inline={true} />
      </div>
    </div>
  );
}
