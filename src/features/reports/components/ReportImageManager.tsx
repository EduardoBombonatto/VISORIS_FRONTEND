'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MAX_CAPTION_LENGTH } from '../schemas/report-schema';
import type { ReportImageManagerProps } from '../types';
import {
  REPORT_IMAGE_DRAG_MIME,
  getNextDisplayOrder,
  readFileAsPreviewUrl,
  resolveRenderableImageSrc,
  sortImagesByDisplayOrder,
  type DraggedReportImagePayload,
} from '../utils/image-url';
import styles from './ReportImageManager.module.css';

export default function ReportImageManager({
  appointmentId,
  images,
  disabled = false,
  isAdding = false,
  onAddImage,
  onReorderImages,
  onInsertImageToEditor,
  onUpdateImageCaption,
  onRemoveImage,
}: ReportImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedImages = useMemo(() => sortImagesByDisplayOrder(images), [images]);

  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const createdObjectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const objectUrls = createdObjectUrlsRef.current;
    return () => {
      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        for (const url of objectUrls) {
          URL.revokeObjectURL(url);
        }
      }
      objectUrls.clear();
    };
  }, []);

  const handleFilesSelected = async (fileList: FileList | null | undefined) => {
    if (!fileList || fileList.length === 0 || disabled || isAdding) return;
    setValidationError(null);

    const files = Array.from(fileList);
    let nextOrder = getNextDisplayOrder(images);

    for (const file of files) {
      try {
        const previewUrl = await readFileAsPreviewUrl(file, appointmentId);
        if (previewUrl.startsWith('blob:')) {
          createdObjectUrlsRef.current.add(previewUrl);
        }
        setLocalPreviews((prev) => ({
          ...prev,
          [previewUrl]: previewUrl,
        }));

        await onAddImage({
          image_url: previewUrl,
          caption: null,
          display_order: nextOrder,
          localPreviewUrl: previewUrl,
        });
        nextOrder += 1;
      } catch {
        setValidationError('Não foi possível carregar a foto selecionada. Tente novamente.');
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void handleFilesSelected(event.target.files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled || isAdding) return;
    void handleFilesSelected(event.dataTransfer.files);
  };

  const handleMoveImage = (index: number, direction: 'UP' | 'DOWN') => {
    if (disabled) return;
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedImages.length) return;

    const cloned = [...sortedImages];
    const currentItem = cloned[index];
    const neighborItem = cloned[targetIndex];

    cloned[index] = {
      ...neighborItem,
      displayOrder: currentItem.displayOrder,
    };
    cloned[targetIndex] = {
      ...currentItem,
      displayOrder: neighborItem.displayOrder,
    };

    const normalized = cloned.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    onReorderImages?.(normalized);
  };

  const countLabel = sortedImages.length === 1 ? '1 foto' : `${sortedImages.length} fotos`;

  return (
    <section className={styles.panelImages} aria-label="Gerenciador de Imagens">
      <div className={styles.panelHeader}>
        <span>Imagens do Exame</span>
        <span className={styles.badgeCount}>{countLabel}</span>
      </div>

      {!disabled && (
        <div>
          <div
            className={styles.dropzone}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              aria-label="Selecionar arquivo de imagem"
              className={styles.hiddenFileInput}
              onChange={handleFileChange}
              disabled={disabled || isAdding}
            />
            <div className={styles.dropzoneIcon} aria-hidden="true">
              ☁️
            </div>
            <p className={styles.dropzoneText}>
              <span>Clique para buscar</span> ou arraste as fotos extraídas do seu equipamento
            </p>
          </div>

          {validationError && (
            <p className={styles.validationError} role="alert">
              {validationError}
            </p>
          )}
        </div>
      )}

      <div className={styles.gallery} aria-label="Galeria de fotos do exame">
        {sortedImages.length === 0 ? (
          <div className={styles.emptyGallery}>
            <p>Nenhuma imagem selecionada. Clique ou arraste fotos acima.</p>
          </div>
        ) : (
          sortedImages.map((img, index) => {
            const photoNumber = `Foto ${String(index + 1).padStart(2, '0')}`;
            const previewSrc = resolveRenderableImageSrc(img.imageUrl, localPreviews);

            const handleCardDragStart = (event: React.DragEvent<HTMLDivElement>) => {
              if (disabled) return;
              const payload: DraggedReportImagePayload = {
                imageUrl: previewSrc,
                caption: img.caption ?? null,
                label: photoNumber,
              };
              event.dataTransfer.setData(REPORT_IMAGE_DRAG_MIME, JSON.stringify(payload));
              event.dataTransfer.setData('text/plain', photoNumber);
              event.dataTransfer.effectAllowed = 'copy';
            };

            return (
              <div
                key={img.id}
                className={styles.imageCard}
                draggable={!disabled}
                onDragStart={handleCardDragStart}
                title={!disabled ? 'Arraste esta foto para dentro da Folha A4' : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt={img.caption || photoNumber}
                  width={80}
                  height={60}
                  loading="lazy"
                  decoding="async"
                  className={styles.imageThumb}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.startsWith('data:image/svg+xml')) {
                      target.src = resolveRenderableImageSrc(
                        `https://storage.visoris.local/${photoNumber}`,
                      );
                    }
                  }}
                />
                <div className={styles.imageDetails}>
                  <div className={styles.imageActions}>
                    <span className={styles.photoLabel}>{photoNumber}</span>

                    {!disabled && (
                      <div className={styles.orderButtons}>
                        {onInsertImageToEditor && (
                          <button
                            type="button"
                            className={styles.btnInsertPaper}
                            onClick={() =>
                              onInsertImageToEditor({ ...img, imageUrl: previewSrc }, photoNumber)
                            }
                            aria-label={`Inserir ${photoNumber} na folha A4`}
                            title="Inserir foto na Folha A4"
                          >
                            + Folha A4
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.btnOrder}
                          disabled={index === 0}
                          aria-label={`Mover ${photoNumber} para cima`}
                          title="Mover para cima"
                          onClick={() => handleMoveImage(index, 'UP')}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className={styles.btnOrder}
                          disabled={index === sortedImages.length - 1}
                          aria-label={`Mover ${photoNumber} para baixo`}
                          title="Mover para baixo"
                          onClick={() => handleMoveImage(index, 'DOWN')}
                        >
                          ↓
                        </button>
                        {onRemoveImage && (
                          <button
                            type="button"
                            className={styles.btnRemove}
                            aria-label={`Excluir ${photoNumber}`}
                            title="Excluir"
                            onClick={() => onRemoveImage(img.id)}
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {!disabled ? (
                    <input
                      type="text"
                      maxLength={MAX_CAPTION_LENGTH}
                      className={styles.captionInput}
                      placeholder="Ex: Esôfago distal..."
                      aria-label={`Legenda da ${photoNumber}`}
                      value={img.caption ?? ''}
                      onChange={(e) => onUpdateImageCaption?.(img.id, e.target.value)}
                    />
                  ) : (
                    <p className={styles.captionText}>{img.caption || 'Sem legenda informada'}</p>
                  )}

                  {!disabled && (
                    <span className={styles.dragHint}>
                      ⇄ Arraste para o papel A4 ou clique em &quot;+ Folha A4&quot;
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
