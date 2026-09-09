import React, { useState, useMemo } from 'react';
import { ClientResponse } from '@/api/index.schemas';
import styles from '../styles/PatientList.module.css';

interface PatientListProps {
  clients: ClientResponse[];
  selectedClientId?: string;
  onSelectClient: (client: ClientResponse) => void;
  onAddPatient: () => void;
}

export function PatientList({
  clients,
  selectedClientId,
  onSelectClient,
  onAddPatient,
}: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Atendidos Hoje'>('Todos');

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch = c.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeFilter === 'Atendidos Hoje') {
        // mock for now
      }
      return matchesSearch;
    });
  }, [clients, searchTerm, activeFilter]);

  return (
    <section className={styles.listPanel}>
      <div className={styles.listHeader}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Tutores e Pacientes</h2>
          <button
            onClick={onAddPatient}
            className={styles.addButton}
            title="Adicionar Tutor/Paciente"
          >
            +
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Procurar tutor por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <button
            onClick={() => setActiveFilter('Todos')}
            className={`${styles.filterChip} ${activeFilter === 'Todos' ? styles.filterChipActive : ''}`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveFilter('Atendidos Hoje')}
            className={`${styles.filterChip} ${activeFilter === 'Atendidos Hoje' ? styles.filterChipActive : ''}`}
          >
            Atendidos Hoje
          </button>
        </div>
      </div>

      <div className={styles.listScroll}>
        {filteredClients.map((client) => {
          const isSelected = client.id === selectedClientId;
          const initials =
            client.fullName
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase() || 'CLI';

          return (
            <div
              key={client.id}
              onClick={() => onSelectClient(client)}
              className={`${styles.patientItem} ${isSelected ? styles.patientItemSelected : ''}`}
            >
              <div className={`${styles.avatar} ${isSelected ? styles.avatarSelected : ''}`}>
                {initials}
              </div>
              <div className={styles.patientInfo}>
                <div className={styles.patientName}>{client.fullName}</div>
                <div className={styles.patientSub}>
                  {client.email || client.phone || 'Sem contato'}
                </div>
              </div>
            </div>
          );
        })}
        {filteredClients.length === 0 && (
          <div className={styles.emptyState}>Nenhum tutor encontrado.</div>
        )}
      </div>
    </section>
  );
}
