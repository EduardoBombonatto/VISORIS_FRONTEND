'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetReportByAppointmentId,
  useCreateReport,
  useUpdateReport,
  useSignReport,
  getGetReportByAppointmentIdQueryKey,
} from '@/api/reports/reports';
import { getListAppointmentsQueryKey } from '@/api/appointments/appointments';
import type { AppointmentResponse, ReportImageResponse, ReportResponse } from '@/api/index.schemas';
import { ApiError } from '@/lib/axios';
import { escapeHtml } from '@/lib/sanitize-html';
import { useAuthStore } from '@/store/auth-store';
import { useClinicsList } from '@/api/clinics/clinics';
import { extractClinics } from '@/features/clinics/utils/clinic-list';
import { useListAppointments } from '@/api/appointments/appointments';
import { extractAppointmentsList } from '@/features/agenda/utils/formatters';
import RichTextEditor from '@/features/templates/components/RichTextEditor';
import Modal from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import type {
  AddReportImageInput,
  ReportClinicSnapshot,
  ReportPatientSnapshot,
  ReportWorkspaceProps,
} from '../types';
import { sortImagesByDisplayOrder } from '../utils/image-url';
import { buildDefaultReportHtml } from '../utils/report-template-default';
import ReportPdfDocument, {
  ReportPdfHeader,
  ReportPdfFooter,
  type ReportPdfClinicData,
  type ReportPdfDoctorData,
} from './ReportPdfDocument';
import TemplateImporter from './TemplateImporter';
import ReportImageManager from './ReportImageManager';
import ConfirmSignModal from './ConfirmSignModal';
import styles from './ReportWorkspace.module.css';

function extractReportFromResponse(raw: unknown): ReportResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const envelope = raw as {
    data?: { data?: ReportResponse } | ReportResponse;
  };
  if (
    envelope.data &&
    typeof envelope.data === 'object' &&
    'data' in envelope.data &&
    envelope.data.data
  ) {
    return envelope.data.data;
  }
  if (envelope.data && typeof envelope.data === 'object' && 'id' in envelope.data) {
    return envelope.data as ReportResponse;
  }
  if ('id' in raw && 'appointmentId' in raw) {
    return raw as ReportResponse;
  }
  return null;
}

function formatDateTimeBR(iso?: string | null): string {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return iso;
  }
}

export default function ReportWorkspace({
  appointmentId,
  initialReport = null,
}: ReportWorkspaceProps) {
  const queryClient = useQueryClient();

  const {
    data: queryData,
    isPending: isLoadingReport,
    error: queryError,
    refetch,
  } = useGetReportByAppointmentId(appointmentId, {
    query: {
      retry: false,
      enabled: Boolean(appointmentId) && !initialReport,
    },
  });

  const createReportMutation = useCreateReport();
  const updateReportMutation = useUpdateReport();
  const signReportMutation = useSignReport();

  const fetchedReport = useMemo(
    () => initialReport ?? extractReportFromResponse(queryData),
    [initialReport, queryData],
  );

  const isNotFoundError = useMemo(() => {
    const err: unknown = queryError;
    if (!err) return false;
    if (err instanceof ApiError && err.httpcode === 404) {
      return true;
    }
    if (typeof err === 'object') {
      const status =
        (err as { status?: number; httpcode?: number }).status ??
        (err as { httpcode?: number }).httpcode;
      return status === 404;
    }
    return false;
  }, [queryError]);

  const currentUser = useAuthStore((state) => state.user);

  const { data: appointmentsData } = useListAppointments(undefined, {
    query: {
      enabled: Boolean(appointmentId),
    },
  });

  const matchedAppointment = useMemo<AppointmentResponse | null>(() => {
    const list = extractAppointmentsList(appointmentsData);
    return list.find((a) => a.id === appointmentId) || null;
  }, [appointmentsData, appointmentId]);

  const { data: clinicsResponse } = useClinicsList();
  const clinics = useMemo(() => extractClinics(clinicsResponse), [clinicsResponse]);

  const [localReportId, setReportId] = useState<string | null>(null);
  const [localContent, setContent] = useState<string | null>(null);
  const [localImages, setImages] = useState<ReportImageResponse[] | null>(null);
  const [localSignedAt, setSignedAt] = useState<string | null>(null);
  const [localAttendanceLocationName, setAttendanceLocationName] = useState<string | null>(null);
  const [localPatientSnapshot, setPatientSnapshot] = useState<ReportPatientSnapshot | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const reportId = localReportId ?? fetchedReport?.id ?? null;
  const images = useMemo(
    () => localImages ?? sortImagesByDisplayOrder(fetchedReport?.images ?? []),
    [localImages, fetchedReport?.images],
  );
  const signedAt = localSignedAt ?? fetchedReport?.signedAt ?? null;
  const attendanceLocationName =
    localAttendanceLocationName ?? fetchedReport?.attendanceLocationName ?? null;
  const patientSnapshot =
    localPatientSnapshot ??
    (fetchedReport?.patientSnapshot as ReportPatientSnapshot | null) ??
    null;

  const clinicInfo = useMemo<ReportPdfClinicData>(() => {
    const snap = fetchedReport?.clinicSnapshot as ReportClinicSnapshot | null | undefined;
    if (snap && snap.name) {
      return {
        name: snap.name,
        cnpj: snap.cnpj || null,
        phone: snap.phone || null,
        address: snap.address || null,
      };
    }

    const locName = attendanceLocationName || matchedAppointment?.clinicName;
    if (locName) {
      const found = clinics.find(
        (c) =>
          c.name.toLowerCase() === locName.toLowerCase() ||
          (locName === matchedAppointment?.clinicName && c.id === matchedAppointment?.clinicId),
      );
      if (found) {
        return {
          name: found.name,
          cnpj: found.cnpj || null,
          phone: found.phone || null,
          address: found.address || null,
        };
      }
      return {
        name: locName,
        cnpj: null,
        phone: null,
        address: null,
      };
    }

    if (matchedAppointment?.clinicId) {
      const foundById = clinics.find((c) => c.id === matchedAppointment.clinicId);
      if (foundById) {
        return {
          name: foundById.name,
          cnpj: foundById.cnpj || null,
          phone: foundById.phone || null,
          address: foundById.address || null,
        };
      }
    }

    return {
      name: 'Local não informado',
      cnpj: null,
      phone: null,
      address: null,
    };
  }, [fetchedReport?.clinicSnapshot, attendanceLocationName, matchedAppointment, clinics]);

  const doctorInfo = useMemo<ReportPdfDoctorData>(() => {
    return {
      name: currentUser?.fullName || '',
      professionalDocument: currentUser?.professionalDocument || null,
      specialty: null,
    };
  }, [currentUser]);

  const patientInfo = useMemo(() => {
    const bio = (patientSnapshot?.biologicalDetails || {}) as Record<string, unknown>;
    return {
      name: patientSnapshot?.name || matchedAppointment?.patientName || '',
      species: bio.species ? String(bio.species) : null,
      breed: bio.breed ? String(bio.breed) : null,
      gender: bio.gender || bio.sex || bio.sexo ? String(bio.gender || bio.sex || bio.sexo) : null,
      age: bio.age ? String(bio.age) : null,
      birthDate: patientSnapshot?.birthDate || null,
      weight: bio.weight || bio.peso ? String(bio.weight || bio.peso) : null,
      covenant: bio.convenio || bio.covenant ? String(bio.convenio || bio.covenant) : null,
    };
  }, [patientSnapshot, matchedAppointment]);

  const appointmentInfo = useMemo(() => {
    return {
      procedureName: matchedAppointment?.procedureName || null,
      clientName: matchedAppointment?.clientName || null,
      scheduledAt: matchedAppointment?.scheduledAt || null,
    };
  }, [matchedAppointment]);

  const defaultInitialContent = useMemo(() => {
    return buildDefaultReportHtml({
      procedureName: matchedAppointment?.procedureName || '',
    });
  }, [matchedAppointment]);

  const contentRevisionRef = useRef(0);
  const content = localContent ?? fetchedReport?.content ?? defaultInitialContent;

  const isSigned = Boolean(signedAt);
  const isSavingDraft = createReportMutation.isPending || updateReportMutation.isPending;
  const isSigning = signReportMutation.isPending;
  const isEditorLocked = isSigned || isSavingDraft || isSigning;

  const applyReportUpdate = (updated: ReportResponse, expectedRevision?: number) => {
    setReportId(updated.id);
    if (expectedRevision === undefined || contentRevisionRef.current === expectedRevision) {
      setContent(updated.content);
      setIsDirty(false);
    }
    if (Array.isArray(updated.images) && updated.images.length > 0) {
      setImages(sortImagesByDisplayOrder(updated.images));
    }
    setSignedAt(updated.signedAt ?? null);
    if (updated.attendanceLocationName !== undefined) {
      setAttendanceLocationName(updated.attendanceLocationName ?? null);
    }
    if (updated.patientSnapshot !== undefined) {
      setPatientSnapshot((updated.patientSnapshot as ReportPatientSnapshot | null) ?? null);
    }
  };

  const ensureDraftReport = async (): Promise<string> => {
    if (reportId) return reportId;

    const revisionAtStart = contentRevisionRef.current;
    const response = await createReportMutation.mutateAsync({
      data: {
        appointment_id: appointmentId,
        content,
      },
    });

    const created = extractReportFromResponse(response);
    if (!created?.id) {
      throw new Error('Não foi possível inicializar o rascunho do laudo.');
    }

    applyReportUpdate(created, revisionAtStart);
    await queryClient.invalidateQueries({
      queryKey: getListAppointmentsQueryKey(),
    });
    return created.id;
  };

  const handleSaveDraft = async () => {
    if (isEditorLocked) return;
    setFeedbackMessage(null);
    const revisionAtStart = contentRevisionRef.current;

    try {
      if (!reportId) {
        const response = await createReportMutation.mutateAsync({
          data: {
            appointment_id: appointmentId,
            content,
          },
        });
        const created = extractReportFromResponse(response);
        if (created) applyReportUpdate(created, revisionAtStart);
      } else {
        const response = await updateReportMutation.mutateAsync({
          id: reportId,
          data: { content },
        });
        const updated = extractReportFromResponse(response);
        if (updated) applyReportUpdate(updated, revisionAtStart);
        else if (contentRevisionRef.current === revisionAtStart) setIsDirty(false);
      }

      await queryClient.invalidateQueries({
        queryKey: getGetReportByAppointmentIdQueryKey(appointmentId),
      });
      await queryClient.invalidateQueries({
        queryKey: getListAppointmentsQueryKey(),
      });

      setFeedbackMessage({
        type: 'success',
        text: 'Rascunho salvo com sucesso!',
      });
    } catch (err) {
      if (err instanceof ApiError && err.httpcode === 409) {
        setFeedbackMessage({
          type: 'error',
          text: err.message || 'Laudo já assinado não pode ser alterado.',
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Erro ao salvar o rascunho do laudo.',
        });
      }
    }
  };

  const handleImportTemplate = (htmlContent: string, templateTitle: string) => {
    if (isEditorLocked) return;
    contentRevisionRef.current += 1;
    setContent(htmlContent);
    setIsDirty(true);
    setFeedbackMessage({
      type: 'success',
      text: `Template "${templateTitle}" importado para o editor.`,
    });
  };

  const handleAddImage = async (input: AddReportImageInput) => {
    if (isSigned) return;

    const newImage: ReportImageResponse = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reportId: reportId ?? `draft-${appointmentId}`,
      imageUrl: input.localPreviewUrl ?? input.image_url,
      caption: input.caption ?? null,
      displayOrder: input.display_order,
      createdAt: new Date().toISOString(),
    };

    setImages((prev) => sortImagesByDisplayOrder([...(prev ?? images), newImage]));
  };

  const handleReorderImages = (reordered: ReportImageResponse[]) => {
    setImages(reordered);
  };

  const handleRemoveImage = (imageId: string) => {
    if (isSigned) return;
    setImages((prev) =>
      (prev ?? images)
        .filter((img) => img.id !== imageId)
        .map((img, idx) => ({ ...img, displayOrder: idx + 1 })),
    );
  };

  const handleUpdateImageCaption = (imageId: string, newCaption: string) => {
    if (isSigned) return;
    setImages((prev) =>
      (prev ?? images).map((img) => (img.id === imageId ? { ...img, caption: newCaption } : img)),
    );
  };

  const handleInsertImageToEditor = (image: ReportImageResponse, label: string) => {
    if (isEditorLocked) return;
    const captionText = image.caption?.trim() ?? '';
    const captionLabel = captionText ? `${label} — ${captionText}` : label;
    const safeUrl = escapeHtml(image.imageUrl);
    const safeLabel = escapeHtml(label);
    const safeCaption = escapeHtml(captionText);
    const safeCaptionLabel = escapeHtml(captionLabel);
    const figureHtml = `<figure class="report-figure" data-report-image="true" data-src="${safeUrl}" data-alt="${safeLabel}" data-caption="${safeCaption}"><img src="${safeUrl}" alt="${safeCaptionLabel}" class="report-figure-img" /><figcaption class="report-figure-caption">${safeCaptionLabel}</figcaption></figure>`;
    contentRevisionRef.current += 1;
    setContent(`${content}${figureHtml}`);
    setIsDirty(true);
    setFeedbackMessage({
      type: 'success',
      text: `${label} inserida na Folha A4.`,
    });
  };

  const handleConfirmSign = async () => {
    if (isSigned || isSigning || isSavingDraft) return;
    setFeedbackMessage(null);
    const revisionAtStart = contentRevisionRef.current;

    try {
      let targetReportId = reportId;
      if (!targetReportId) {
        targetReportId = await ensureDraftReport();
      } else if (isDirty) {
        await updateReportMutation.mutateAsync({
          id: targetReportId,
          data: { content },
        });
        if (contentRevisionRef.current === revisionAtStart) {
          setIsDirty(false);
        }
      }

      const response = await signReportMutation.mutateAsync({
        id: targetReportId,
      });
      const signedReport = extractReportFromResponse(response);

      if (signedReport) {
        applyReportUpdate(signedReport, revisionAtStart);
        if (!signedReport.signedAt) {
          setSignedAt(new Date().toISOString());
        }
      } else {
        setSignedAt(new Date().toISOString());
      }

      setSignModalOpen(false);

      await queryClient.invalidateQueries({
        queryKey: getGetReportByAppointmentIdQueryKey(appointmentId),
      });
      await queryClient.invalidateQueries({
        queryKey: getListAppointmentsQueryKey(),
      });

      setFeedbackMessage({
        type: 'success',
        text: 'Laudo assinado e finalizado com sucesso!',
      });
    } catch (err) {
      setSignModalOpen(false);
      setFeedbackMessage({
        type: 'error',
        text:
          err instanceof Error ? err.message : 'Não foi possível assinar o laudo. Tente novamente.',
      });
    }
  };

  const patientDisplayName = patientSnapshot?.name || `Agendamento #${appointmentId}`;
  const locationDisplayName = attendanceLocationName || 'Unidade de Atendimento';

  const editorHeaderSlot = useMemo(
    () => (
      <ReportPdfHeader
        clinic={clinicInfo}
        doctor={doctorInfo}
        patient={patientInfo}
        appointment={appointmentInfo}
        patientName={patientDisplayName}
      />
    ),
    [clinicInfo, doctorInfo, patientInfo, appointmentInfo, patientDisplayName],
  );

  const editorFooterSlot = useMemo(
    () => (
      <ReportPdfFooter
        doctor={doctorInfo}
        isSigned={isSigned}
        signedAt={signedAt}
        reportId={reportId}
        appointmentScheduledAt={appointmentInfo?.scheduledAt}
      />
    ),
    [doctorInfo, isSigned, signedAt, reportId, appointmentInfo?.scheduledAt],
  );

  if (isLoadingReport && !initialReport && !isNotFoundError) {
    return (
      <div className={styles.loadingContainer} role="status" aria-label="Carregando laudo">
        <div className={styles.loadingHeader}>
          <Skeleton style={{ width: '240px', height: '28px' }} />
          <Skeleton style={{ width: '160px', height: '28px' }} />
        </div>
        <div className={styles.loadingSplit}>
          <Skeleton style={{ width: '360px', height: '480px' }} />
          <Skeleton style={{ flex: 1, height: '480px' }} />
        </div>
      </div>
    );
  }

  const hasQueryError = Boolean(queryError as unknown);

  if (hasQueryError && !isNotFoundError && !initialReport) {
    return (
      <div className={styles.errorState} role="alert">
        <h2 className={styles.errorTitle}>Não foi possível carregar o laudo</h2>
        <p className={styles.errorDescription}>
          Ocorreu uma falha ao consultar os dados do agendamento #{appointmentId}.
        </p>
        <div className={styles.errorActions}>
          <button type="button" className={styles.btnOutline} onClick={() => refetch()}>
            Tentar novamente
          </button>
          <Link href="/dashboard" className={styles.btnPrimary}>
            Voltar para a Agenda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.workspacePage}>
      {/* Topbar de Contexto */}
      <header className={styles.topbar}>
        <div className={styles.breadcrumbGroup}>
          <Link href="/dashboard" className={styles.backLink}>
            ← Voltar para a Agenda
          </Link>
          <span className={styles.breadcrumbDivider}>/</span>
          <span className={styles.breadcrumbCurrent}>
            Laudo — <strong>{patientDisplayName}</strong> ({locationDisplayName})
          </span>
        </div>

        <div className={styles.statusGroup}>
          {isSigned ? (
            <span className={styles.badgeSigned}>
              ✓ Laudo Assinado
              {signedAt ? ` em ${formatDateTimeBR(signedAt)}` : ''}
            </span>
          ) : (
            <span className={styles.badgeDraft}>
              {reportId ? 'Em Rascunho' : 'Novo Rascunho'}
              {isDirty ? ' (alterações não salvas)' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          role={feedbackMessage.type === 'error' ? 'alert' : 'status'}
          className={`${styles.feedbackBanner} ${
            feedbackMessage.type === 'error' ? styles.feedbackError : styles.feedbackSuccess
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            className={styles.feedbackClose}
            aria-label="Fechar mensagem"
            onClick={() => setFeedbackMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Workspace Dividido em Duas Áreas Principais */}
      <div className={styles.workspaceGrid}>
        {/* Área 1: Painel Lateral/Superior de Imagens (em memória para a Folha A4) */}
        <ReportImageManager
          appointmentId={appointmentId}
          images={images}
          disabled={isEditorLocked}
          isAdding={isSavingDraft}
          onAddImage={handleAddImage}
          onReorderImages={handleReorderImages}
          onInsertImageToEditor={handleInsertImageToEditor}
          onUpdateImageCaption={handleUpdateImageCaption}
          onRemoveImage={handleRemoveImage}
        />

        {/* Área 2: Painel do Editor de Texto Rico + Importar Template + Rodapé */}
        <section className={styles.panelEditor} aria-label="Editor de Laudo">
          <div className={styles.editorHeader}>
            <TemplateImporter
              currentContent={content}
              disabled={isEditorLocked}
              onImportContent={handleImportTemplate}
            />

            <div className={styles.patientMeta}>
              <span className={styles.metaLabel}>Paciente</span>
              <strong className={styles.metaValue}>
                {patientDisplayName}
                {patientSnapshot?.patientType ? ` (${patientSnapshot.patientType})` : ''}
              </strong>
            </div>
          </div>

          <div className={styles.editorBody}>
            <RichTextEditor
              value={content}
              editable={!isEditorLocked}
              headerSlot={editorHeaderSlot}
              footerSlot={editorFooterSlot}
              onChange={(newHtml) => {
                if (newHtml === content || (content === '' && newHtml === '<p></p>')) {
                  return;
                }
                contentRevisionRef.current += 1;
                setContent(newHtml);
                setIsDirty(true);
              }}
            />
          </div>

          <footer className={styles.editorFooter}>
            {isSigned ? (
              <div className={styles.signedFooterNotice}>
                <span>
                  Este laudo foi assinado oficialmente e encontra-se em modo somente leitura.
                </span>
                <div className={styles.signedFooterActions}>
                  <button
                    type="button"
                    className={styles.btnOutline}
                    onClick={() => setPdfPreviewOpen(true)}
                  >
                    Visualizar PDF
                  </button>
                  <Link href="/dashboard" className={styles.btnOutline}>
                    Retornar à Agenda Diária
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.btnOutline}
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSigning}
                >
                  {isSavingDraft ? 'Salvando...' : 'Salvar Rascunho'}
                </button>
                <button
                  type="button"
                  className={styles.btnOutline}
                  onClick={() => setPdfPreviewOpen(true)}
                >
                  Visualizar PDF
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => setSignModalOpen(true)}
                  disabled={isSavingDraft || isSigning}
                >
                  {isSigning ? 'Assinando...' : 'Finalizar e Assinar Laudo'}
                </button>
              </>
            )}
          </footer>
        </section>
      </div>

      <ConfirmSignModal
        isOpen={signModalOpen}
        isSigning={isSigning || isSavingDraft}
        patientName={patientSnapshot?.name}
        onConfirm={handleConfirmSign}
        onCancel={() => setSignModalOpen(false)}
      />

      <Modal
        open={pdfPreviewOpen}
        size="xl"
        title="Pré-visualização do Documento PDF (Folha A4)"
        onClose={() => setPdfPreviewOpen(false)}
      >
        {pdfPreviewOpen ? (
          <div className={styles.pdfPreviewContainer}>
            <div className={styles.pdfToolbarTop}>
              <span className={styles.previewHint}>
                Folha A4 oficial • O documento impresso ou salvo em PDF será 100% idêntico a esta
                pré-visualização.
              </span>
              <div className={styles.pdfActions}>
                <button
                  type="button"
                  className={styles.btnOutline}
                  onClick={() => setPdfPreviewOpen(false)}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.print) {
                      window.print();
                    }
                  }}
                >
                  Imprimir / Baixar PDF
                </button>
              </div>
            </div>

            <div className={styles.pdfDocumentWrapper}>
              <ReportPdfDocument
                id="report-print-target"
                clinic={clinicInfo}
                doctor={doctorInfo}
                patient={patientInfo}
                appointment={appointmentInfo}
                content={content}
                images={images}
                patientName={patientDisplayName}
                isSigned={isSigned}
                signedAt={signedAt}
                reportId={reportId}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
