'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ClientResponse, PatientListResponse, PatientResponse } from '@/api/index.schemas';
import {
  usePatientsList,
  usePatientsDelete,
  getPatientsListQueryKey,
} from '@/api/patients/patients';
import { useClientsDelete, getClientsListQueryKey } from '@/api/clients/clients';
import { EditClientModal } from './EditClientModal';
import { EditPatientModal } from './EditPatientModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import styles from '../styles/PatientDetail.module.css';

interface PatientDetailProps {
  client: ClientResponse | null;
  hasClients?: boolean;
  onAddTutor?: () => void;
  onAddPatientForClient?: (client: ClientResponse) => void;
  onClientDeleted?: (clientId: string) => void;
}

export function PatientDetail({
  client,
  hasClients = false,
  onAddTutor,
  onAddPatientForClient,
  onClientDeleted,
}: PatientDetailProps) {
  const queryClient = useQueryClient();
  const deleteClient = useClientsDelete();
  const deletePatient = usePatientsDelete();

  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isConfirmDeleteClientOpen, setIsConfirmDeleteClientOpen] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  const [patientToEdit, setPatientToEdit] = useState<PatientResponse | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<PatientResponse | null>(null);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);

  const { data: patientsResponse, isLoading: isLoadingPatients } = usePatientsList(
    { clientId: (client ? client.id : '0') as unknown as number },
    { query: { enabled: !!client } },
  );

  const rawData = patientsResponse?.data;
  const patients: PatientResponse[] =
    (rawData as { data?: PatientListResponse })?.data?.patients ||
    (rawData as unknown as PatientListResponse)?.patients ||
    [];

  if (!client) {
    return (
      <section className={styles.emptyState}>
        <div className={styles.emptyStateIconContainer} aria-hidden="true">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>
        <h3 className={styles.emptyStateTitle}>
          {hasClients ? 'Nenhum tutor selecionado' : 'Nenhum tutor cadastrado'}
        </h3>
        <p className={styles.emptyStateDescription}>
          {hasClients
            ? 'Selecione um tutor na lista ao lado para ver os detalhes e seus pacientes.'
            : 'Cadastre seu primeiro tutor e paciente para começar a gerenciar fichas e prontuários na clínica.'}
        </p>
        {onAddTutor && (
          <button type="button" className={styles.emptyStateButton} onClick={onAddTutor}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>{hasClients ? 'Novo Cadastro' : 'Cadastrar Primeiro Tutor'}</span>
          </button>
        )}
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

  const togglePatient = (patientId: string) => {
    setExpandedPatientId((prev) => (prev === patientId ? null : patientId));
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Não informada';
    try {
      if (dateStr.includes('-')) {
        const [year, month, day] = dateStr.split('-');
        if (year && month && day) {
          return `${day.substring(0, 2)}/${month}/${year}`;
        }
      }
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const handleConfirmDeleteClient = async () => {
    if (!client) return;
    setIsDeletingClient(true);
    try {
      await deleteClient.mutateAsync({
        id: client.id as unknown as number,
      });

      queryClient.invalidateQueries({ queryKey: getClientsListQueryKey() });
      setIsConfirmDeleteClientOpen(false);
      onClientDeleted?.(client.id);
    } catch {
      alert('Erro ao excluir tutor. Verifique se existem dependências ou tente novamente.');
    } finally {
      setIsDeletingClient(false);
    }
  };

  const handleConfirmDeletePatient = async () => {
    if (!patientToDelete || !client) return;
    setIsDeletingPatient(true);
    try {
      await deletePatient.mutateAsync({
        id: patientToDelete.id as unknown as number,
      });

      queryClient.invalidateQueries({
        queryKey: getPatientsListQueryKey({ clientId: client.id as unknown as number }),
      });
      setPatientToDelete(null);
    } catch {
      alert('Erro ao excluir paciente. Tente novamente.');
    } finally {
      setIsDeletingPatient(false);
    }
  };

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
          <button
            type="button"
            className={styles.btnOutline}
            onClick={() => setIsEditClientOpen(true)}
            title="Editar informações do tutor"
          >
            Editar Tutor
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={() => setIsConfirmDeleteClientOpen(true)}
            title="Excluir este tutor"
          >
            Excluir Tutor
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => onAddPatientForClient?.(client)}
            title="Adicionar novo pet a este tutor"
          >
            Novo Paciente
          </button>
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

          <div className={styles.patientList}>
            {isLoadingPatients ? (
              <div className={styles.timelineEmpty}>Carregando pacientes...</div>
            ) : patients.length === 0 ? (
              <div className={styles.timelineEmpty}>
                Nenhum paciente cadastrado para este tutor.
              </div>
            ) : (
              patients.map((p: PatientResponse) => {
                const isExpanded = expandedPatientId === p.id;
                const bio = (p.biologicalDetails || {}) as Record<string, unknown>;

                const species = String(bio.species || 'Não informada');
                const breed = String(bio.breed || 'Não informada');
                const coatColor = String(bio.coat_color || bio.coatColor || 'Não informada');
                const age = String(bio.age || 'Não informada');

                const petInitial = (p.name || 'P')[0].toUpperCase();

                return (
                  <div
                    key={p.id}
                    className={`${styles.patientCard} ${isExpanded ? styles.patientCardSelected : ''}`}
                  >
                    <div
                      className={styles.patientCardHeader}
                      onClick={() => togglePatient(p.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          togglePatient(p.id);
                        }
                      }}
                    >
                      <div className={styles.patientCardInfo}>
                        <div className={styles.petAvatar}>{petInitial}</div>
                        <div>
                          <div className={styles.patientCardName}>{p.name}</div>
                          <div className={styles.patientCardHint}>
                            {species !== 'Não informada' ? species : 'Pet'}{' '}
                            {breed !== 'Não informada' ? `• ${breed}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className={styles.patientCardRight}>
                        <div className={styles.cardActions}>
                          <button
                            type="button"
                            className={styles.petActionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPatientToEdit(p);
                            }}
                            title="Editar este pet"
                          >
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={`${styles.petActionBtn} ${styles.petActionBtnDelete}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPatientToDelete(p);
                            }}
                            title="Excluir este pet"
                          >
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                        <span
                          className={`${styles.expandIcon} ${isExpanded ? styles.expandIconRotated : ''}`}
                        >
                          ▼
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles.patientCardDetails}>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Espécie</span>
                          <span className={styles.infoValue}>{species}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Raça</span>
                          <span className={styles.infoValue}>{breed}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Cor da Pelagem</span>
                          <span className={styles.infoValue}>{coatColor}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Data de Nascimento</span>
                          <span className={styles.infoValue}>{formatDate(p.birthDate)}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Idade</span>
                          <span className={styles.infoValue}>{age}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Cadastrado em</span>
                          <span className={styles.infoValue}>{formatDate(p.createdAt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Modal de Edição do Tutor */}
      {isEditClientOpen && (
        <EditClientModal
          open={isEditClientOpen}
          client={client}
          onClose={() => setIsEditClientOpen(false)}
        />
      )}

      {/* Confirmação de Exclusão do Tutor */}
      <ConfirmDeleteModal
        open={isConfirmDeleteClientOpen}
        title="Excluir Tutor"
        description={`Tem certeza que deseja excluir o tutor "${client.fullName}"? Todos os pets e registros vinculados serão impactados.`}
        confirmText="Sim, excluir tutor"
        isDeleting={isDeletingClient}
        onConfirm={handleConfirmDeleteClient}
        onClose={() => setIsConfirmDeleteClientOpen(false)}
      />

      {/* Modal de Edição do Pet */}
      {patientToEdit && (
        <EditPatientModal
          open={!!patientToEdit}
          patient={patientToEdit}
          clientId={client.id}
          onClose={() => setPatientToEdit(null)}
        />
      )}

      {/* Confirmação de Exclusão do Pet */}
      <ConfirmDeleteModal
        open={!!patientToDelete}
        title="Excluir Paciente"
        description={`Tem certeza que deseja excluir o pet "${patientToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, excluir paciente"
        isDeleting={isDeletingPatient}
        onConfirm={handleConfirmDeletePatient}
        onClose={() => setPatientToDelete(null)}
      />
    </section>
  );
}
