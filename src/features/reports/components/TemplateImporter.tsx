'use client';

import React, { useMemo, useState } from 'react';
import { useListTemplates, getTemplateById } from '@/api/templates/templates';
import type { TemplateDetailResponse, TemplateSummaryResponse } from '@/api/index.schemas';
import Modal from '@/components/ui/Modal';
import type { TemplateImporterProps } from '../types';
import styles from './TemplateImporter.module.css';

function hasMeaningfulHtmlContent(html: string): boolean {
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  if (stripped.length > 0) return true;
  return /<(img|figure|svg|video|audio|iframe|table|hr|canvas)\b/i.test(html);
}

export default function TemplateImporter({
  currentContent,
  disabled = false,
  onImportContent,
}: TemplateImporterProps) {
  const { data, isPending } = useListTemplates();
  const [selectedId, setSelectedId] = useState<string>('');
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<{
    id: string;
    title: string;
    content: string;
  } | null>(null);

  const templates: TemplateSummaryResponse[] = useMemo(() => {
    return (
      data?.data?.data?.templates ??
      (data?.data as unknown as { templates?: TemplateSummaryResponse[] })?.templates ??
      []
    );
  }, [data]);

  const handleSelectChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = event.target.value;
    setSelectedId(templateId);
    setErrorMessage(null);

    if (!templateId) return;

    setIsLoadingTemplate(true);
    try {
      const response = await getTemplateById(templateId);
      const detail =
        response?.data?.data ?? (response?.data as unknown as TemplateDetailResponse | undefined);

      if (!detail || typeof detail.content !== 'string') {
        setErrorMessage('Não foi possível carregar o conteúdo do template.');
        return;
      }

      if (hasMeaningfulHtmlContent(currentContent)) {
        setPendingTemplate({
          id: detail.id,
          title: detail.title,
          content: detail.content,
        });
      } else {
        onImportContent(detail.content, detail.title);
      }
    } catch {
      setErrorMessage('Erro ao buscar o template selecionado.');
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleConfirmOverwrite = () => {
    if (!pendingTemplate) return;
    onImportContent(pendingTemplate.content, pendingTemplate.title);
    setPendingTemplate(null);
  };

  const handleCancelOverwrite = () => {
    setPendingTemplate(null);
    setSelectedId('');
  };

  return (
    <div className={styles.importerContainer}>
      <label htmlFor="report-template-importer" className={styles.label}>
        Importar Template
      </label>
      <div className={styles.selectRow}>
        <select
          id="report-template-importer"
          aria-label="Importar Template"
          className={styles.templateSelect}
          value={selectedId}
          onChange={handleSelectChange}
          disabled={disabled || isPending || isLoadingTemplate}
        >
          <option value="">
            {isPending ? 'Carregando templates...' : 'Selecionar template base...'}
          </option>
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.title}
            </option>
          ))}
        </select>
        {isLoadingTemplate && (
          <span className={styles.loadingHint} role="status">
            Importando...
          </span>
        )}
      </div>

      {errorMessage && (
        <span className={styles.errorText} role="alert">
          {errorMessage}
        </span>
      )}

      <Modal
        open={Boolean(pendingTemplate)}
        title="Substituir conteúdo do laudo"
        onClose={handleCancelOverwrite}
      >
        <div className={styles.modalContent}>
          <p className={styles.modalDescription}>
            O editor já possui texto redigido. Deseja substituir o conteúdo atual pelo modelo{' '}
            <strong>&quot;{pendingTemplate?.title}&quot;</strong>?
          </p>
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancel} onClick={handleCancelOverwrite}>
              Cancelar
            </button>
            <button type="button" className={styles.btnConfirm} onClick={handleConfirmOverwrite}>
              Confirmar Importação
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
