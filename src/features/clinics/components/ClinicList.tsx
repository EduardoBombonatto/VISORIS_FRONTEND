'use client';

import { useClinicsList } from '@/api/clinics/clinics';
import type { ClinicData } from '@/api/index.schemas';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { extractClinics } from '../utils/clinic-list';
import ClinicCard from './ClinicCard';
import styles from './ClinicList.module.css';

interface ClinicListProps {
  onAddClinic?: () => void;
}

export default function ClinicList({ onAddClinic }: ClinicListProps) {
  const {
    data: clinics,
    isPending,
    isError,
    refetch,
  } = useClinicsList<ClinicData[]>({
    query: {
      select: (result) => extractClinics(result),
    },
  });

  if (isPending) {
    return (
      <div className={styles.state} role="status" aria-label="Carregando clínicas">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.state}>
        <Alert variant="error">Não foi possível carregar as clínicas.</Alert>
        <Button type="button" className={styles.retry} onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!clinics || clinics.length === 0) {
    return (
      <div className={styles.empty}>
        <h3 className={styles.emptyTitle}>Nenhuma clínica cadastrada</h3>
        <p className={styles.emptyText}>Cadastre seu primeiro local de atendimento para começar.</p>
        {onAddClinic ? (
          <Button type="button" className={styles.emptyAction} onClick={onAddClinic}>
            Adicionar Clínica
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {clinics.map((clinic) => (
        <ClinicCard key={clinic.id} clinic={clinic} />
      ))}
    </div>
  );
}
