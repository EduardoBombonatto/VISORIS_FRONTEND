'use client';

import { useState } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useClinicsList } from '@/api/clinics/clinics';
import type { ClinicData } from '@/api/index.schemas';
import ClinicList from '@/features/clinics/components/ClinicList';
import ClinicForm from '@/features/clinics/components/ClinicForm';
import { extractClinics } from '@/features/clinics/utils/clinic-list';
import styles from './page.module.css';

export default function ClinicsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [justCreated, setJustCreated] = useState(false);

  const { data: clinics } = useClinicsList<ClinicData[]>({
    query: {
      select: extractClinics,
    },
  });
  const hasClinics = (clinics?.length ?? 0) > 0;

  const openForm = () => {
    setJustCreated(false);
    setFormOpen(true);
  };

  const handleCreated = () => {
    setFormOpen(false);
    setJustCreated(true);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Clínicas</h1>
          <p className={styles.subtitle}>Gerencie seus locais de atendimento.</p>
        </div>
        {hasClinics ? (
          <Button type="button" className={styles.add} onClick={openForm}>
            Adicionar Clínica
          </Button>
        ) : null}
      </header>

      {justCreated ? <Alert variant="success">Clínica cadastrada com sucesso.</Alert> : null}

      <ClinicList onAddClinic={openForm} />

      <Modal open={formOpen} title="Adicionar Clínica" onClose={() => setFormOpen(false)}>
        <ClinicForm onClose={() => setFormOpen(false)} onSuccess={handleCreated} />
      </Modal>
    </div>
  );
}
