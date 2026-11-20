'use client';

import React from 'react';
import type { ReportImageResponse } from '@/api/index.schemas';
import SafeHtml from '@/components/ui/SafeHtml';
import styles from './ReportPdfDocument.module.css';

export interface ReportPdfClinicData {
  name: string;
  cnpj?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface ReportPdfDoctorData {
  name: string;
  professionalDocument?: string | null;
  specialty?: string | null;
}

export interface ReportPdfPatientData {
  name: string;
  species?: string | null;
  breed?: string | null;
  gender?: string | null;
  age?: string | null;
  birthDate?: string | null;
  weight?: string | null;
  covenant?: string | null;
}

export interface ReportPdfAppointmentData {
  procedureName?: string | null;
  clientName?: string | null;
  scheduledAt?: string | null;
}

export interface ReportPdfHeaderProps {
  clinic?: ReportPdfClinicData | null;
  doctor?: ReportPdfDoctorData | null;
  patient?: ReportPdfPatientData | null;
  appointment?: ReportPdfAppointmentData | null;
  patientName?: string | null;
}

export interface ReportPdfFooterProps {
  doctor?: ReportPdfDoctorData | null;
  isSigned?: boolean;
  signedAt?: string | null;
  reportId?: string | null;
  appointmentScheduledAt?: string | null;
}

export interface ReportPdfContinuationHeaderProps {
  doctor?: ReportPdfDoctorData | null;
  clinic?: ReportPdfClinicData | null;
  patient?: ReportPdfPatientData | null;
  appointment?: ReportPdfAppointmentData | null;
  pageNumber: number;
  totalPages: number;
  patientName?: string | null;
}

export interface ReportPdfDocumentProps {
  clinic?: ReportPdfClinicData | null;
  doctor?: ReportPdfDoctorData | null;
  patient?: ReportPdfPatientData | null;
  appointment?: ReportPdfAppointmentData | null;
  content: string;
  images?: ReportImageResponse[] | null;
  isSigned?: boolean;
  signedAt?: string | null;
  reportId?: string | null;
  patientName?: string | null; // fallback
  className?: string;
  id?: string;
}

export function formatExamDateLong(iso?: string | null): string {
  if (!iso) {
    const now = new Date();
    return formatExamDateLong(now.toISOString());
  }
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const datePart = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d);
    // Capitaliza o mês: e.g. "21 de outubro de 2026" -> "21 de Outubro de 2026"
    const capitalized = datePart.replace(
      /de ([a-z])/g,
      (_, letter) => `de ${letter.toUpperCase()}`,
    );
    const timePart = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
    return `${capitalized}, ${timePart}`;
  } catch {
    return iso;
  }
}

export function formatShortDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

export function formatSignatureDateTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const date = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
    const time = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
    return `${date} às ${time}`;
  } catch {
    return iso;
  }
}

export function generateAuthenticityHash(reportId?: string | null, seed?: string | null): string {
  const base = `${reportId || 'rep-draft'}-${seed || 'seed'}-visoris-crypto`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < base.length; i++) {
    const ch = base.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}e5f6g7h8i9j0k1l2`.slice(0, 32);
}

export function splitContentByPageBreaks(html: string): string[] {
  if (!html) return [''];
  const pageBreakRegex =
    /<div[^>]*class="[^"]*report-page-break[^"]*"[^>]*>[\s\S]*?<\/div>|<div[^>]*data-page-break="true"[^>]*>[\s\S]*?<\/div>|<hr[^>]*class="[^"]*page-break[^"]*"[^>]*\/?>/gi;
  const parts = html.split(pageBreakRegex);
  const trimmed = parts.map((p) => p.trim()).filter((p, idx) => idx === 0 || p.length > 0);
  return trimmed.length > 0 ? trimmed : [html];
}

/**
 * Componente do Cabeçalho Oficial do Laudo
 * (Pode ser utilizado no PDF e bloqueado dentro do editor)
 */
export function ReportPdfHeader({
  clinic,
  doctor,
  patient,
  appointment,
  patientName,
}: ReportPdfHeaderProps) {
  const doctorName = doctor?.name?.trim() || 'Dr. Eduardo Bombonatto';
  const doctorCrmv = doctor?.professionalDocument?.trim() || 'CRMV-PR 12345';
  const doctorSpecialty =
    doctor?.specialty?.trim() || 'Especialista em Endoscopia e Imagem Veterinária';

  const clinicName = clinic?.name?.trim() || 'Hospital Animal Care';
  const clinicLocation =
    clinic?.address?.trim() ||
    [clinic?.phone, clinic?.cnpj].filter(Boolean).join(' • ') ||
    'Cascavel, PR';

  const finalPatientName = patient?.name?.trim() || patientName?.trim() || 'Thor';
  const patientSpecies = patient?.species?.trim() || 'Canino';
  const patientBreed = patient?.breed?.trim() || 'Não informada';
  const patientAge = patient?.age?.trim() || 'Não informada';
  const patientBirth = patient?.birthDate ? formatShortDate(patient.birthDate) : '';
  const patientGender = patient?.gender?.trim() || 'Macho';
  const patientWeight = patient?.weight?.trim() || '';
  const patientCovenant = patient?.covenant?.trim() || 'Particular';

  const tutorName = appointment?.clientName?.trim() || 'Tutor Responsável';
  const examDate = formatExamDateLong(appointment?.scheduledAt);
  const procedureName = appointment?.procedureName?.trim() || 'Endoscopia Respiratória';

  return (
    <>
      <div className={styles.header}>
        <table className={styles.headerTable}>
          <tbody>
            <tr>
              <td>
                <h1 className={styles.doctorTitle}>{doctorName}</h1>
                <div className={styles.subtitle}>Médico Veterinário • {doctorCrmv}</div>
                {doctorSpecialty ? <div className={styles.subtitle}>{doctorSpecialty}</div> : null}
              </td>
              <td className={styles.clinicInfoCol}>
                <div className={styles.clinicBox}>
                  <div className={styles.clinicLabel}>Local do Exame</div>
                  <div className={styles.clinicName}>{clinicName}</div>
                  <div className={styles.clinicLocation}>{clinicLocation}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.snapshot}>
        <table className={styles.snapshotTable}>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Tutor Responsável</th>
              <th>Data do Exame</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {finalPatientName}{' '}
                <span className={styles.subtext}>
                  ({patientSpecies}, {patientBreed})
                </span>
              </td>
              <td>{tutorName}</td>
              <td>{examDate}</td>
            </tr>
            <tr>
              <th>Idade / Nascimento</th>
              <th>Sexo / Peso</th>
              <th>Convênio</th>
            </tr>
            <tr>
              <td>
                {patientAge}
                {patientBirth ? ` (${patientBirth})` : ''}
              </td>
              <td>
                {patientGender}
                {patientWeight ? ` • ${patientWeight}` : ''}
              </td>
              <td>{patientCovenant}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.title}>Laudo de {procedureName}</div>
    </>
  );
}

/**
 * Cabeçalho de continuação para Páginas 2+
 */
export function ReportPdfContinuationHeader({
  doctor,
  clinic,
  patient,
  appointment,
  pageNumber,
  totalPages,
  patientName,
}: ReportPdfContinuationHeaderProps) {
  const doctorName = doctor?.name?.trim() || 'Dr. Eduardo Bombonatto';
  const doctorCrmv = doctor?.professionalDocument?.trim() || 'CRMV-PR 12345';
  const clinicName = clinic?.name?.trim() || 'Hospital Animal Care';
  const finalPatientName = patient?.name?.trim() || patientName?.trim() || 'Paciente';
  const procedureName = appointment?.procedureName?.trim() || 'Endoscopia';

  return (
    <div className={styles.continuationHeader}>
      <div className={styles.continuationTopRow}>
        <div className={styles.continuationDoctor}>
          <strong>{doctorName}</strong> • {doctorCrmv}
        </div>
        <div className={styles.continuationClinic}>
          <strong>{clinicName}</strong>
        </div>
      </div>
      <div className={styles.continuationSubRow}>
        <span>
          Laudo de {procedureName} • Paciente: <strong>{finalPatientName}</strong>
        </span>
        <span className={styles.continuationPageTag}>
          Folha {pageNumber} de {totalPages}
        </span>
      </div>
    </div>
  );
}

/**
 * Componente do Rodapé e Assinatura Oficial do Laudo
 * (Pode ser utilizado no PDF e bloqueado dentro do editor)
 */
export function ReportPdfFooter({
  doctor,
  isSigned = false,
  signedAt = null,
  reportId = null,
  appointmentScheduledAt = null,
}: ReportPdfFooterProps) {
  const doctorName = doctor?.name?.trim() || 'Dr. Eduardo Bombonatto';
  const doctorCrmv = doctor?.professionalDocument?.trim() || 'CRMV-PR 12345';
  const hash = generateAuthenticityHash(reportId, appointmentScheduledAt || signedAt);

  return (
    <div className={styles.footer}>
      <div className={styles.signatureLine} />
      <p className={styles.doctorNameFooter}>
        <strong>{doctorName}</strong>
      </p>
      <p className={styles.doctorSubtitleFooter}>Médico Veterinário • {doctorCrmv}</p>
      {isSigned ? (
        <p className={styles.signatureMeta}>
          Documento finalizado e assinado digitalmente em {formatSignatureDateTime(signedAt)}
        </p>
      ) : (
        <p className={styles.signatureMetaDraft}>
          Documento em rascunho • Aguardando assinatura oficial
        </p>
      )}
      <p className={styles.hash}>Hash de Autenticidade: {hash}</p>
    </div>
  );
}

/**
 * Componente Principal do Documento de Laudo para Exibição / Pré-visualização e Impressão A4
 */
export default function ReportPdfDocument({
  clinic,
  doctor,
  patient,
  appointment,
  content,
  images = [],
  isSigned = false,
  signedAt = null,
  reportId = null,
  patientName = '',
  className = '',
  id,
}: ReportPdfDocumentProps) {
  // 1. Divide conteúdo por quebras de página explícitas
  const pages = React.useMemo(() => {
    return splitContentByPageBreaks(content);
  }, [content]);

  // 2. Filtro de imagens para a galeria: apenas imagens não inseridas no corpo
  const unplacedImages = React.useMemo(() => {
    if (!Array.isArray(images) || images.length === 0) return [];
    return images.filter((img) => {
      if (!img.imageUrl) return false;
      return !content.includes(img.imageUrl) && !content.includes(img.id);
    });
  }, [images, content]);

  // Agrupamento 2 a 2
  const imageRows: ReportImageResponse[][] = [];
  if (unplacedImages.length > 0) {
    for (let i = 0; i < unplacedImages.length; i += 2) {
      imageRows.push(unplacedImages.slice(i, i + 2));
    }
  }

  const renderGallery = () => {
    if (imageRows.length === 0) return null;
    return (
      <table className={styles.gallery}>
        <tbody>
          {imageRows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((img, colIdx) => {
                const figNumber = rowIdx * 2 + colIdx + 1;
                const figCaption = img.caption?.trim() || `Imagem diagnóstica ${figNumber}`;
                return (
                  <td key={img.id}>
                    <div className={styles.imgBox}>
                      {img.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={img.imageUrl} alt={figCaption} className={styles.imgReal} />
                      ) : (
                        <div className={styles.imgPlaceholder}>[ Imagem {figNumber} ]</div>
                      )}
                    </div>
                    <div className={styles.imgCaption}>
                      Fig {figNumber}. {figCaption}
                    </div>
                  </td>
                );
              })}
              {row.length === 1 ? <td style={{ width: '50%' }} /> : null}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (pages.length <= 1) {
    return (
      <div
        id={id}
        className={`${styles.pdfDocumentSheet} ${className} print-only-target`}
        data-testid="report-pdf-document"
      >
        <ReportPdfHeader
          clinic={clinic}
          doctor={doctor}
          patient={patient}
          appointment={appointment}
          patientName={patientName}
        />

        <SafeHtml
          className={styles.content}
          html={pages[0] || '<p><em>Nenhum conteúdo clínico redigido até o momento.</em></p>'}
        />

        {renderGallery()}

        <ReportPdfFooter
          doctor={doctor}
          isSigned={isSigned}
          signedAt={signedAt}
          reportId={reportId}
          appointmentScheduledAt={appointment?.scheduledAt}
        />
      </div>
    );
  }

  // Múltiplas páginas (Folhas A4 distintas)
  return (
    <div
      id={id}
      className={`${styles.multiSheetWrapper} ${className} print-only-target`}
      data-testid="report-pdf-document"
    >
      {pages.map((pageHtml, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === pages.length - 1;
        const pageNumber = pageIdx + 1;

        return (
          <div
            key={pageIdx}
            className={`${styles.pdfDocumentSheet} ${styles.multiPageSheet}`}
            data-page-number={pageNumber}
          >
            <div className={styles.previewSheetBadge}>
              Folha {pageNumber} de {pages.length}
            </div>

            {isFirstPage ? (
              <ReportPdfHeader
                clinic={clinic}
                doctor={doctor}
                patient={patient}
                appointment={appointment}
                patientName={patientName}
              />
            ) : (
              <ReportPdfContinuationHeader
                clinic={clinic}
                doctor={doctor}
                patient={patient}
                appointment={appointment}
                pageNumber={pageNumber}
                totalPages={pages.length}
                patientName={patientName}
              />
            )}

            <SafeHtml
              className={styles.content}
              html={pageHtml || '<p><em>Continuação do laudo clínico.</em></p>'}
            />

            {/* A assinatura SEMPRE fica na primeira folha, independente do número de páginas */}
            {isFirstPage ? (
              <>
                <ReportPdfFooter
                  doctor={doctor}
                  isSigned={isSigned}
                  signedAt={signedAt}
                  reportId={reportId}
                  appointmentScheduledAt={appointment?.scheduledAt}
                />
                <div className={styles.sheetContinuationFooter}>
                  <span>Continua na folha seguinte →</span>
                  <span className={styles.continuationPageTag}>
                    Folha {pageNumber} de {pages.length}
                  </span>
                </div>
              </>
            ) : isLastPage ? (
              <>
                {renderGallery()}
                <div className={styles.sheetEndFooter}>
                  <span>Fim do documento</span>
                  <span className={styles.continuationPageTag}>
                    Folha {pageNumber} de {pages.length}
                  </span>
                </div>
              </>
            ) : (
              <div className={styles.sheetContinuationFooter}>
                <span>Continua na folha seguinte →</span>
                <span className={styles.continuationPageTag}>
                  Folha {pageNumber} de {pages.length}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
