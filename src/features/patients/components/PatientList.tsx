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
            type="button"
            onClick={onAddPatient}
            className={styles.addButton}
            title="Adicionar Tutor/Paciente"
            aria-label="Adicionar Tutor ou Paciente"
          >
            +
          </button>
        </div>

        <search className={styles.searchWrapper}>
          <span className={styles.searchIcon} aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            placeholder="Procurar tutor por nome..."
            aria-label="Procurar tutor por nome"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </search>

        <div className={styles.filters}>
          <button
            type="button"
            onClick={() => setActiveFilter('Todos')}
            aria-pressed={activeFilter === 'Todos'}
            className={`${styles.filterChip} ${activeFilter === 'Todos' ? styles.filterChipActive : ''}`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('Atendidos Hoje')}
            aria-pressed={activeFilter === 'Atendidos Hoje'}
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
            <button
              key={client.id}
              type="button"
              onClick={() => onSelectClient(client)}
              aria-pressed={isSelected}
              className={`${styles.patientItem} ${isSelected ? styles.patientItemSelected : ''}`}
            >
              <span
                className={`${styles.avatar} ${isSelected ? styles.avatarSelected : ''}`}
                aria-hidden="true"
              >
                {initials}
              </span>
              <span className={styles.patientInfo}>
                <span className={styles.patientName}>{client.fullName}</span>
                <span className={styles.patientSub}>
                  {client.email || client.phone || 'Sem contato'}
                </span>
              </span>
            </button>
          );
        })}
        {filteredClients.length === 0 && (
          <div className={styles.emptyState}>Nenhum tutor encontrado.</div>
        )}
      </div>
    </section>
  );
}
