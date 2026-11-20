import React from 'react';
import ReportWorkspace from '@/features/reports/components/ReportWorkspace';
import styles from './page.module.css';

export const metadata = {
  title: 'Edição de Laudo - Visoris',
  description:
    'Estação de trabalho médica para redação, anexação de imagens e assinatura de laudos.',
};

interface ReportPageProps {
  params: Promise<{
    appointmentId: string;
  }>;
}

export default async function ReportByAppointmentPage({ params }: ReportPageProps) {
  const { appointmentId } = await params;

  return (
    <div className={styles.pageContainer}>
      <ReportWorkspace appointmentId={appointmentId} />
    </div>
  );
}
