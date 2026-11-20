'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListTemplates,
  useGetTemplateById,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  getListTemplatesQueryKey,
  getGetTemplateByIdQueryKey,
} from '@/api/templates/templates';
import type { TemplateSummaryResponse } from '@/api/index.schemas';
import Alert from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import NativeDialog from '@/components/ui/NativeDialog';
import SafeHtml from '@/components/ui/SafeHtml';
import RichTextEditor from './RichTextEditor';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import styles from './TemplateWorkspace.module.css';

interface TemplateWorkspaceProps {
  initialTemplateId?: string;
  isCreatingNew?: boolean;
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface EditorFormProps {
  selectedId: string | null;
  isCreating: boolean;
  initialTitle: string;
  initialContent: string;
  onSave: (title: string, content: string) => Promise<void>;
  onDelete?: () => void;
  onCancel: () => void;
  isSaving: boolean;
  serverError: string | null;
}

function EditorForm({
  selectedId,
  isCreating,
  initialTitle,
  initialContent,
  onSave,
  onDelete,
  onCancel,
  isSaving,
  serverError,
}: EditorFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  const validate = (): boolean => {
    let valid = true;
    if (!title.trim()) {
      setTitleError('O título do template é obrigatório.');
      valid = false;
    } else {
      setTitleError(null);
    }

    if (!stripHtml(content).trim()) {
      setContentError('O conteúdo do laudo é obrigatório.');
      valid = false;
    } else {
      setContentError(null);
    }

    return valid;
  };

  const handleFormSubmit = async () => {
    if (!validate()) return;
    await onSave(title, content);
  };

  return (
    <>
      <div className={styles.editorModalHeader}>
        <div className={styles.editorHeaderTop}>
          <div className={styles.editorHeaderTitle}>
            <h3 id="workspace-template-modal-title">
              {isCreating || !selectedId ? 'Novo Template' : 'Editando Template'}
            </h3>
            <p className={styles.editorHeaderSubtitle}>
              {isCreating
                ? 'Defina o título e o corpo formatado do novo modelo de laudo.'
                : 'Atualize as informações e o conteúdo formatado do laudo.'}
            </p>
          </div>
          <div className={styles.actionButtonsRight}>
            {selectedId && !isCreating && onDelete ? (
              <button
                type="button"
                className={styles.btnDeleteHeader}
                onClick={onDelete}
                disabled={isSaving}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Excluir
              </button>
            ) : null}

            <button
              type="button"
              className={styles.btnCancelForm}
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </button>

            <button
              type="button"
              className={styles.btnSave}
              onClick={handleFormSubmit}
              disabled={isSaving}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>

            <button
              type="button"
              className={styles.btnCloseModal}
              onClick={onCancel}
              disabled={isSaving}
              aria-label="Fechar formulário"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {serverError ? <Alert variant="error">{serverError}</Alert> : null}

        {/* Metadados: Nome do Template */}
        <div className={styles.templateMeta}>
          <div className={styles.metaInputGroup} style={{ width: '100%' }}>
            <label htmlFor="workspace-template-title">Nome do Template *</label>
            <input
              id="workspace-template-title"
              type="text"
              placeholder="Ex: EDA - Normal Padrão"
              maxLength={255}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              className={titleError ? styles.hasError : ''}
            />
            {titleError ? <p className={styles.fieldError}>{titleError}</p> : null}
          </div>
        </div>
      </div>

      {/* Editor com Folha A4 Fixa */}
      <div className={styles.editorModalBody}>
        <RichTextEditor
          value={content}
          onChange={(html) => {
            setContent(html);
            if (contentError) setContentError(null);
          }}
          error={contentError ?? undefined}
        />
      </div>
    </>
  );
}

export default function TemplateWorkspace({
  initialTemplateId,
  isCreatingNew = false,
}: TemplateWorkspaceProps) {
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(
    isCreatingNew ? null : (initialTemplateId ?? null),
  );
  const [isCreating, setIsCreating] = useState(isCreatingNew);
  const [isFormModalOpen, setIsFormModalOpen] = useState(
    isCreatingNew || Boolean(initialTemplateId),
  );
  const initialAutoSelectRef = useRef(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Todas as alterações salvas');
  const [statusType, setStatusType] = useState<'success' | 'pending' | 'error'>('success');

  const [templateToDelete, setTemplateToDelete] = useState<TemplateSummaryResponse | null>(null);

  // Queries
  const { data: listData, isPending: isLoadingList } = useListTemplates();

  const templates: TemplateSummaryResponse[] = useMemo(() => {
    return (
      listData?.data?.data?.templates ??
      (listData?.data as unknown as { templates?: TemplateSummaryResponse[] })?.templates ??
      []
    );
  }, [listData]);

  // Auto-seleciona o primeiro template para o preview caso nada tenha sido selecionado
  useEffect(() => {
    if (!initialAutoSelectRef.current && !isCreatingNew && !selectedId && templates.length > 0) {
      initialAutoSelectRef.current = true;
      setSelectedId(templates[0].id);
      setIsCreating(false);
    }
  }, [templates, selectedId, isCreatingNew]);

  // Template atualmente selecionado
  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedId) ?? null;
  }, [templates, selectedId]);

  // Busca detalhe do template selecionado
  const { data: detailData, isPending: isLoadingDetail } = useGetTemplateById(selectedId ?? '', {
    query: {
      enabled: Boolean(selectedId) && !isCreating,
    },
  });

  // Mutations
  const { mutateAsync: createMutation, isPending: isCreatingMutation } = useCreateTemplate();
  const { mutateAsync: updateMutation, isPending: isUpdating } = useUpdateTemplate();
  const { mutateAsync: deleteMutation, isPending: isDeleting } = useDeleteTemplate();

  const isSaving = isCreatingMutation || isUpdating;

  // Filtragem da lista por busca
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;
    const term = searchTerm.toLowerCase().trim();
    return templates.filter((t) => t.title.toLowerCase().includes(term));
  }, [templates, searchTerm]);

  // Ações
  const handleSelectTemplate = (template: TemplateSummaryResponse) => {
    setIsCreating(false);
    setSelectedId(template.id);
    setIsFormModalOpen(true);
    setServerError(null);
    setStatusMessage('Todas as alterações salvas');
    setStatusType('success');
    window.history.pushState(null, '', `/templates/${template.id}`);
  };

  const handleStartNew = () => {
    setIsCreating(true);
    setSelectedId(null);
    setIsFormModalOpen(true);
    setServerError(null);
    setStatusMessage('Novo modelo');
    setStatusType('pending');
    window.history.pushState(null, '', '/templates/new');
  };

  const handleOpenEditModal = (template: TemplateSummaryResponse) => {
    setIsCreating(false);
    setSelectedId(template.id);
    setIsFormModalOpen(true);
  };

  const handleCloseForm = useCallback(() => {
    setIsFormModalOpen(false);
    if (selectedId) {
      window.history.pushState(null, '', `/templates/${selectedId}`);
    } else {
      window.history.pushState(null, '', '/templates');
    }
  }, [selectedId]);

  const handleSave = async (title: string, content: string) => {
    setServerError(null);
    setStatusMessage('Salvando alterações...');
    setStatusType('pending');

    try {
      if (selectedId && !isCreating) {
        // Atualização
        await updateMutation({
          id: selectedId,
          data: {
            title: title.trim(),
            content,
          },
        });

        await queryClient.invalidateQueries({
          queryKey: getListTemplatesQueryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: getGetTemplateByIdQueryKey(selectedId),
        });

        setStatusMessage('Todas as alterações salvas');
        setStatusType('success');
        setIsFormModalOpen(false);
      } else {
        // Criação
        const response = await createMutation({
          data: {
            title: title.trim(),
            content,
          },
        });

        const newId = response?.data?.data?.id;

        await queryClient.invalidateQueries({
          queryKey: getListTemplatesQueryKey(),
        });

        if (newId) {
          setIsCreating(false);
          setSelectedId(newId);
          window.history.pushState(null, '', `/templates/${newId}`);
        }

        setStatusMessage('Template cadastrado com sucesso');
        setStatusType('success');
        setIsFormModalOpen(false);
      }
    } catch {
      setServerError('Não foi possível salvar o template. Verifique os dados e tente novamente.');
      setStatusMessage('Erro ao salvar');
      setStatusType('error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      await deleteMutation({ id: templateToDelete.id });
      await queryClient.invalidateQueries({
        queryKey: getListTemplatesQueryKey(),
      });

      if (selectedId === templateToDelete.id) {
        const remaining = templates.filter((t) => t.id !== templateToDelete.id);
        if (remaining.length > 0) {
          setSelectedId(remaining[0].id);
          setIsCreating(false);
        } else {
          setSelectedId(null);
          setIsCreating(false);
        }
      }

      setTemplateToDelete(null);
      setIsFormModalOpen(false);
    } catch {
      setServerError('Erro ao excluir o template.');
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Topbar com Breadcrumb e Status */}
      <header className={styles.topbar}>
        <div className={styles.breadcrumb}>
          Configurações / <span>Gestor de Templates</span>
        </div>
        <div className={`${styles.statusSaved} ${styles[statusType]}`}>
          {statusType === 'success' ? (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <span>{statusMessage}</span>
        </div>
      </header>

      {/* Split-View Workspace */}
      <div className={styles.workspace}>
        {/* Coluna Esquerda: Biblioteca de Templates */}
        <section className={styles.templateListPanel} aria-label="Biblioteca de Templates">
          <div className={styles.listHeader}>
            <div className={styles.listHeaderTitle}>
              <h2>Modelos de Laudo</h2>
              <button
                type="button"
                className={styles.btnNewTemplate}
                onClick={handleStartNew}
                title="Criar Novo Template"
                aria-label="Criar Novo Template"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>

            <div className={styles.searchBox}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Procurar modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Procurar modelo"
              />
            </div>
          </div>

          <div className={styles.templatesScroll}>
            <div className={styles.templateGroupTitle}>Modelos Cadastrados</div>

            {isLoadingList ? (
              <div
                style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <Skeleton style={{ height: '48px', width: '100%', borderRadius: '8px' }} />
                <Skeleton style={{ height: '48px', width: '100%', borderRadius: '8px' }} />
                <Skeleton style={{ height: '48px', width: '100%', borderRadius: '8px' }} />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className={styles.emptyListText}>
                {templates.length === 0
                  ? 'Nenhum template cadastrado. Clique no "+" para criar o primeiro.'
                  : `Nenhum modelo encontrado para "${searchTerm}".`}
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const isSelected = !isCreating && selectedId === template.id;
                const snippet = `Criado em ${formatDate(template.createdAt)}`;

                return (
                  <div
                    key={template.id}
                    className={`${styles.templateItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleSelectTemplate(template)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSelectTemplate(template);
                      }
                    }}
                    aria-label={`Selecionar template ${template.title}`}
                  >
                    <div className={styles.templateItemHeader}>
                      <span className={styles.templateItemTitle}>{template.title}</span>
                      <button
                        type="button"
                        className={styles.deleteIconBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTemplateToDelete(template);
                        }}
                        title={`Excluir ${template.title}`}
                        aria-label={`Excluir template ${template.title}`}
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                    <span className={styles.templateItemDesc}>{snippet}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Coluna Direita: Painel do Template (Visualização) */}
        <section className={styles.templateEditorPanel} aria-label="Visualização do Template">
          {isLoadingDetail && selectedId && !isCreating ? (
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Skeleton style={{ height: '36px', width: '300px' }} />
              <Skeleton style={{ height: '500px', width: '100%' }} />
            </div>
          ) : selectedTemplate ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
              <div className={styles.previewHeader}>
                <div className={styles.previewTitleInfo}>
                  <h2 className={styles.previewTitle}>{selectedTemplate.title}</h2>
                  <span className={styles.previewMeta}>
                    Criado em {formatDate(selectedTemplate.createdAt)}
                  </span>
                </div>
                <div className={styles.previewActions}>
                  <button
                    type="button"
                    className={styles.btnDeleteHeader}
                    onClick={() => setTemplateToDelete(selectedTemplate)}
                    disabled={isDeleting}
                  >
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Excluir
                  </button>
                  <button
                    type="button"
                    className={styles.btnEditTemplate}
                    onClick={() => handleOpenEditModal(selectedTemplate)}
                  >
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Editar Modelo
                  </button>
                </div>
              </div>

              <div className={styles.previewContentArea}>
                <div className={styles.previewPaperSheet}>
                  <SafeHtml
                    html={
                      detailData?.data?.data?.content ||
                      '<p><em>Nenhum conteúdo no modelo.</em></p>'
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyWorkspace}>
              <svg
                width="48"
                height="48"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3>Nenhum modelo selecionado</h3>
              <p>Selecione um modelo na lista ao lado ou crie um novo modelo de laudo.</p>
              <button type="button" className={styles.btnSave} onClick={handleStartNew}>
                + Novo Modelo
              </button>
            </div>
          )}
        </section>
      </div>

      {/* POPUP MODAL NATIVO (<dialog>) PARA O FORMULÁRIO DO TEMPLATE */}
      <NativeDialog
        open={isFormModalOpen}
        onClose={handleCloseForm}
        dismissible={!isSaving}
        ariaLabelledBy="workspace-template-modal-title"
        className={styles.formModalDialog}
      >
        {isLoadingDetail && selectedId && !isCreating ? (
          <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Skeleton style={{ height: '36px', width: '300px' }} />
            <Skeleton style={{ height: '500px', width: '100%' }} />
          </div>
        ) : (
          <EditorForm
            key={isCreating ? 'new' : (selectedId ?? 'empty')}
            selectedId={selectedId}
            isCreating={isCreating}
            initialTitle={isCreating ? '' : (detailData?.data?.data?.title ?? '')}
            initialContent={isCreating ? '' : (detailData?.data?.data?.content ?? '')}
            onSave={handleSave}
            onCancel={handleCloseForm}
            onDelete={() => {
              const cur = templates.find((t) => t.id === selectedId);
              if (cur) setTemplateToDelete(cur);
            }}
            isSaving={isSaving}
            serverError={serverError}
          />
        )}
      </NativeDialog>

      {/* Modal de Confirmação de Exclusão com Backdrop Desfocado */}
      <ConfirmDeleteModal
        open={Boolean(templateToDelete)}
        templateTitle={templateToDelete?.title ?? ''}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setTemplateToDelete(null)}
      />
    </div>
  );
}
