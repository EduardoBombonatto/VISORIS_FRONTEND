import React from 'react';
import { ClientResponse, PatientListResponse } from '@/api/index.schemas';
import { usePatientsList } from '@/api/patients/patients';
import styles from '../styles/PatientDetail.module.css';

interface PatientDetailProps {
  client: ClientResponse | null;
}

export function PatientDetail({ client }: PatientDetailProps) {
  const { data: patientsResponse, isLoading: isLoadingPatients } = usePatientsList(
    { clientId: (client ? client.id : '0') as unknown as number },
    { query: { enabled: !!client } },
  );

  const patients = (patientsResponse?.data?.data as PatientListResponse)?.patients || [];

  if (!client) {
    return (
      <section className={styles.emptyState}>
        <p>Selecione um tutor na lista para ver os detalhes e seus pacientes.</p>
      </section>
    );
  }

  const initials =
    client.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'CLI';

  return (
    <section className={styles.detailPanel}>
      {/* Cabeçalho do Perfil (Tutor) */}
      <div className={styles.profileHeader}>
        <div className={styles.profileInfo}>
          <div className={styles.avatarLarge}>{initials}</div>
          <div>
            <h2 className={styles.patientName}>{client.fullName}</h2>
            <div className={styles.patientMeta}>
              <span>ID: #{client.id}</span>
              {client.email && <span>Email: {client.email}</span>}
              {client.phone && <span className={styles.genderBadge}>{client.phone}</span>}
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline}>Editar Tutor</button>
          <button className={styles.btnPrimary}>Novo Paciente</button>
        </div>
      </div>

      {/* Corpo do Perfil */}
      <div className={styles.profileBody}>
        {/* Secção: Dados do Tutor */}
        <section>
          <h3 className={styles.sectionTitle}>Dados do Tutor</h3>
          <div className={styles.demographicsGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>CPF</span>
              <span className={styles.infoValue}>{client.documentCpf || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Telefone</span>
              <span className={styles.infoValue}>{client.phone || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{client.email || '-'}</span>
            </div>
          </div>
        </section>

        {/* Secção: Pacientes Vinculados */}
        <section>
          <h3 className={styles.sectionTitle}>Pacientes Vinculados</h3>

          <div className={styles.timeline}>
            {isLoadingPatients ? (
              <div className={styles.timelineEmpty}>Carregando pacientes...</div>
            ) : patients.length === 0 ? (
              <div className={styles.timelineEmpty}>
                Nenhum paciente cadastrado para este tutor.
              </div>
            ) : (
              patients.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>
                    {p.name} ({p.patientType})
                  </span>
                  {p.birthDate && (
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Nasc: {p.birthDate}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
