'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListTemplates,
  useDeleteTemplate,
  getListTemplatesQueryKey,
} from '@/api/templates/templates';
import type { TemplateSummaryResponse } from '@/api/index.schemas';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import styles from './TemplateList.module.css';

interface TemplateListProps {
  onDeleteTemplate?: (template: TemplateSummaryResponse) => void;
  isDeleting?: boolean;
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '—';
  }
}

export default function TemplateList({
  onDeleteTemplate: externalOnDelete,
  isDeleting: externalIsDeleting,
}: TemplateListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState<TemplateSummaryResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch } = useListTemplates();
  const { mutateAsync: deleteTemplateMutation, isPending: isDeletingInternal } =
    useDeleteTemplate();

  const isDeleting = externalIsDeleting ?? isDeletingInternal;

  const templates: TemplateSummaryResponse[] = useMemo(() => {
    return (
      data?.data?.data?.templates ??
      (data?.data as unknown as { templates?: TemplateSummaryResponse[] })?.templates ??
      []
    );
  }, [data]);

  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;
    const term = searchTerm.toLowerCase().trim();
    return templates.filter((template) => template.title.toLowerCase().includes(term));
  }, [templates, searchTerm]);

  const handleDeleteClick = (template: TemplateSummaryResponse) => {
    externalOnDelete?.(template);
    setTemplateToDelete(template);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    setDeleteError(null);

    try {
      await deleteTemplateMutation({ id: templateToDelete.id });
      await queryClient.invalidateQueries({
        queryKey: getListTemplatesQueryKey(),
      });
      setTemplateToDelete(null);
    } catch {
      setDeleteError('Não foi possível excluir o template. Tente novamente.');
    }
  };

  if (isPending) {
    return (
      <div className={styles.container} role="status" aria-label="Carregando templates">
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Título</th>
                <th className={styles.th}>Data de Criação</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((i) => (
                <tr key={i} className={styles.tr}>
                  <td className={styles.skeletonCell}>
                    <Skeleton style={{ height: '20px', width: '60%' }} />
                  </td>
                  <td className={styles.skeletonCell}>
                    <Skeleton style={{ height: '20px', width: '35%' }} />
                  </td>
                  <td className={styles.skeletonCell} style={{ textAlign: 'right' }}>
                    <Skeleton style={{ height: '28px', width: '120px', display: 'inline-block' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.stateWrapper}>
        <Alert variant="error">Não foi possível carregar os templates de laudo.</Alert>
        <Button type="button" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyTitle}>Nenhum template cadastrado</h3>
        <p className={styles.emptyText}>
          Crie seu primeiro modelo de laudo clínico para acelerar o preenchimento de diagnósticos.
        </p>
        <Link href="/templates/new" className={styles.emptyAction}>
          Novo Template
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {deleteError ? <Alert variant="error">{deleteError}</Alert> : null}

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar template por título"
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Título</th>
              <th className={styles.th} style={{ width: '220px' }}>
                Data de Criação
              </th>
              <th className={styles.th} style={{ width: '180px', textAlign: 'right' }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{ textAlign: 'center', padding: '32px' }}
                  className={styles.templateDate}
                >
                  Nenhum template encontrado para &quot;{searchTerm}&quot;.
                </td>
              </tr>
            ) : (
              filteredTemplates.map((template) => (
                <tr key={template.id} className={styles.tr}>
                  <td className={styles.td}>
                    <span className={styles.templateTitle}>{template.title}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.templateDate}>{formatDate(template.createdAt)}</span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actionsCell}>
                      <Link
                        href={`/templates/${template.id}`}
                        className={styles.editBtn}
                        aria-label={`Editar template ${template.title}`}
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteClick(template)}
                        disabled={isDeleting}
                        aria-label={`Excluir template ${template.title}`}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        open={Boolean(templateToDelete)}
        templateTitle={templateToDelete?.title ?? ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setTemplateToDelete(null)}
      />
    </div>
  );
}
