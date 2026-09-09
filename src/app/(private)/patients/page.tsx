'use client';

import React, { useState } from 'react';
import { PatientList } from '@/features/patients/components/PatientList';
import { PatientDetail } from '@/features/patients/components/PatientDetail';
import { Skeleton } from '@/components/ui/Skeleton';
import { PatientModal } from '@/features/patients/components/PatientModal';
import { useClientsList } from '@/api/clients/clients';
import styles from './page.module.css';

import { ClientListResponse } from '@/api/index.schemas';
// ...
export default function PatientsPage() {
  const { data: clientsResponse, isLoading, error } = useClientsList();
  const clients = (clientsResponse?.data?.data as ClientListResponse)?.clients || [];

  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fallback to first client if none selected
  const selectedClient =
    clients.find((c) => c.id === selectedClientId) || (clients.length ? clients[0] : null);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.workspace}>
        {/* LIST COLUMN */}
        {isLoading ? (
          <section className={styles.listSkeletonContainer}>
            <Skeleton style={{ height: '2rem', width: '12rem', marginBottom: '1.5rem' }} />
            <Skeleton style={{ height: '2.5rem', width: '100%', marginBottom: '0.75rem' }} />
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}
            >
              <Skeleton style={{ height: '4rem', width: '100%' }} />
              <Skeleton style={{ height: '4rem', width: '100%' }} />
              <Skeleton style={{ height: '4rem', width: '100%' }} />
            </div>
          </section>
        ) : error ? (
          <section className={`${styles.listSkeletonContainer} ${styles.listSkeletonError}`}>
            <p className={styles.errorMessage}>Erro ao carregar tutores.</p>
          </section>
        ) : (
          <PatientList
            clients={clients}
            selectedClientId={selectedClient?.id}
            onSelectClient={(c) => setSelectedClientId(c.id)}
            onAddPatient={() => setIsModalOpen(true)}
          />
        )}

        {/* DETAIL COLUMN */}
        {isLoading ? (
          <section className={styles.detailSkeletonContainer}>
            <div className={styles.skeletonHeader}>
              <Skeleton className={styles.skeletonAvatar} />
              <div className={styles.skeletonTitleGroup}>
                <Skeleton className={styles.skeletonTitle} />
                <Skeleton className={styles.skeletonSubtitle} />
              </div>
            </div>
            <Skeleton className={styles.skeletonSectionTitle} />
            <Skeleton className={styles.skeletonSectionBody} />
            <Skeleton className={styles.skeletonSectionTitle} />
            <Skeleton className={styles.skeletonTimelineBody} />
          </section>
        ) : (
          <PatientDetail client={selectedClient} />
        )}
      </div>

      {isModalOpen && <PatientModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
