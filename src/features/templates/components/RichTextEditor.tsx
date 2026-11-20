'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { MacroTag } from '../extensions/macro-tag';
import { ReportImage } from '../extensions/report-image';
import { PageBreak } from '../extensions/page-break';
import {
  REPORT_IMAGE_DRAG_MIME,
  type DraggedReportImagePayload,
} from '@/features/reports/utils/image-url';
import type { RichTextEditorProps } from '../types';
import styles from './RichTextEditor.module.css';

const CLINICAL_VARIABLES = [
  '[Nome do Paciente]',
  '[Idade]',
  '[Data do Exame]',
  '[Médico Solicitante]',
  '[Distância TEG]',
  '[Medicamentos]',
];

export default function RichTextEditor({
  value = '',
  onChange,
  editable = true,
  error,
  headerSlot,
  footerSlot,
}: RichTextEditorProps) {
  const [isDraggingImageOver, setIsDraggingImageOver] = useState(false);
  const macroPopoverId = useId();
  const macroPopoverRef = useRef<HTMLDivElement>(null);
  const lastEmittedHtmlRef = useRef<string | undefined>(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      MacroTag,
      ReportImage,
      PageBreak,
    ],
    content: value,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: styles.paperSheet,
        'aria-label': 'Editor de texto do template',
      },
      handleDrop: (view, event) => {
        const rawPayload = event.dataTransfer?.getData(REPORT_IMAGE_DRAG_MIME);
        if (!rawPayload) return false;

        event.preventDefault();
        setIsDraggingImageOver(false);

        try {
          const parsed = JSON.parse(rawPayload) as DraggedReportImagePayload;
          if (!parsed.imageUrl) return false;

          const node = view.state.schema.nodes.reportImage?.create({
            src: parsed.imageUrl,
            alt: parsed.label || 'Foto do Exame',
            caption: parsed.caption || '',
          });
          if (!node) return false;

          const coords = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });
          const insertPos = coords?.pos ?? view.state.doc.content.size;
          const transaction = view.state.tr.insert(insertPos, node);
          view.dispatch(transaction);
          return true;
        } catch {
          return false;
        }
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      lastEmittedHtmlRef.current = html;
      onChange?.(html);
    },
  });

  const insertMacro = (variable: string) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'macroTag',
        attrs: { label: variable },
      })
      .insertContent(' ')
      .run();
    const popoverEl = macroPopoverRef.current as
      (HTMLDivElement & { hidePopover?: () => void }) | null;
    popoverEl?.hidePopover?.();
  };

  // Sincroniza valor externo quando o template for carregado via API (edição)
  // Ignora eco imediato vindo do próprio onUpdate para evitar re-serialização de HTML a cada tecla
  useEffect(() => {
    if (!editor) return;
    if (value === undefined || value === lastEmittedHtmlRef.current) return;
    const currentHtml = editor.getHTML();
    lastEmittedHtmlRef.current = value;
    if (value !== currentHtml) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  // Sincroniza modo editável / somente leitura (ex: após assinatura do laudo)
  useEffect(() => {
    if (!editor) return;
    if (editor.isEditable !== editable) {
      editor.setEditable(editable, false);
    }
  }, [editable, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div>
      <div className={`${styles.editorWrapper} ${error ? styles.hasError : ''}`}>
        <div className={styles.toolbar} role="toolbar" aria-label="Formatação de texto">
          <button
            type="button"
            disabled={!editable}
            className={`${styles.toolButton} ${editor.isActive('bold') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Negrito (Ctrl+B)"
            aria-label="Negrito"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            disabled={!editable}
            className={`${styles.toolButton} ${editor.isActive('italic') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Itálico (Ctrl+I)"
            aria-label="Itálico"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            disabled={!editable}
            className={`${styles.toolButton} ${editor.isActive('underline') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Sublinhado (Ctrl+U)"
            aria-label="Sublinhado"
          >
            <span style={{ textDecoration: 'underline' }}>U</span>
          </button>

          <div className={styles.toolDivider} />

          <button
            type="button"
            disabled={!editable}
            className={`${styles.toolButton} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Título Secundário (H2)"
            aria-label="Título H2"
          >
            H2
          </button>
          <button
            type="button"
            disabled={!editable}
            className={`${styles.toolButton} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Subtítulo (H3)"
            aria-label="Subtítulo H3"
          >
            H3
          </button>
          <button
            type="button"
            disabled={!editable}
            className={`${styles.toolButton} ${editor.isActive('paragraph') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().setParagraph().run()}
            title="Parágrafo normal"
            aria-label="Parágrafo normal"
          >
            P
          </button>

          <div className={styles.toolDivider} />

          <button
            type="button"
            disabled={!editable}
            className={`${styles.toolButton} ${editor.isActive('bulletList') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Lista com marcadores"
            aria-label="Lista com marcadores"
          >
            • Lista
          </button>
          <button
            type="button"
            disabled={!editable}
            className={`${styles.toolButton} ${editor.isActive('orderedList') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Lista numerada"
            aria-label="Lista numerada"
          >
            1. Lista
          </button>

          <div className={styles.toolDivider} />

          <button
            type="button"
            disabled={!editable}
            className={styles.btnPageBreak}
            onClick={() => editor.chain().focus().setPageBreak().run()}
            title="Inserir Quebra de Página (Nova Folha A4)"
            aria-label="Inserir Quebra de Página"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            + Nova Página
          </button>

          <div className={styles.toolbarRight}>
            <div className={styles.macrosDropdown}>
              <button
                type="button"
                disabled={!editable}
                className={styles.btnMacro}
                popoverTarget={macroPopoverId}
                title="Inserir macro / variável médica"
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                Inserir Variável
                <svg
                  width="10"
                  height="10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div
                ref={macroPopoverRef}
                id={macroPopoverId}
                {...({ popover: 'auto' } as Record<string, string>)}
                className={styles.macroMenu}
                aria-label="Variáveis clínicas disponíveis"
              >
                {CLINICAL_VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={styles.macroMenuItem}
                    onClick={() => insertMacro(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <span className={styles.pageBadge}>Folha A4 (PDF)</span>
          </div>
        </div>

        {isDraggingImageOver && editable ? (
          <div className={styles.dropHintBanner}>
            Solte a foto na Folha A4 para inseri-la no laudo
          </div>
        ) : null}

        <div
          className={`${styles.contentArea} ${isDraggingImageOver ? styles.dropTargetActive : ''}`}
          onDragOver={(event) => {
            if (!editable) return;
            if (
              event.dataTransfer?.types.includes(REPORT_IMAGE_DRAG_MIME) ||
              event.dataTransfer?.types.includes('text/plain')
            ) {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
              if (!isDraggingImageOver) {
                setIsDraggingImageOver(true);
              }
            }
          }}
          onDragLeave={() => {
            if (isDraggingImageOver) {
              setIsDraggingImageOver(false);
            }
          }}
          onDrop={(event) => {
            if (!editable || !editor) return;
            setIsDraggingImageOver(false);
            if (event.defaultPrevented) return;

            const rawPayload = event.dataTransfer?.getData(REPORT_IMAGE_DRAG_MIME);
            if (!rawPayload) return;

            event.preventDefault();
            try {
              const parsed = JSON.parse(rawPayload) as DraggedReportImagePayload;
              if (!parsed.imageUrl) return;
              editor
                .chain()
                .focus()
                .insertContent({
                  type: 'reportImage',
                  attrs: {
                    src: parsed.imageUrl,
                    alt: parsed.label || 'Foto do Exame',
                    caption: parsed.caption || '',
                  },
                })
                .run();
            } catch {
              // Ignora payload malformado
            }
          }}
        >
          <div className={styles.paperSheetContainer}>
            {headerSlot ? (
              <div
                className={styles.lockedHeaderWrapper}
                contentEditable={false}
                data-testid="locked-report-header"
              >
                <div className={styles.lockedNotice}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Cabeçalho Oficial • Preenchimento Automático (Bloqueado)
                </div>
                {headerSlot}
              </div>
            ) : null}

            <div className={styles.editorBodyArea}>
              <EditorContent editor={editor} className={styles.editorContent} />
            </div>

            {footerSlot ? (
              <div
                className={styles.lockedFooterWrapper}
                contentEditable={false}
                data-testid="locked-report-footer"
              >
                <div className={styles.lockedNotice}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Rodapé e Assinatura Oficial • Gerado pelo Sistema (Bloqueado)
                </div>
                {footerSlot}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {error ? <p className={styles.errorMessage}>{error}</p> : null}
    </div>
  );
}
