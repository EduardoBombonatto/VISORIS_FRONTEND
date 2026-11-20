'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './NativeDialog.module.css';

export interface NativeDialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissible?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  className?: string;
}

function isOutsideDialogRect(clientX: number, clientY: number, dialog: HTMLDialogElement): boolean {
  const rect = dialog.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return true;
  }
  return clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom;
}

export default function NativeDialog({
  open,
  onClose,
  children,
  dismissible = true,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  className = '',
}: NativeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  }, [onClose, dismissible]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') {
        try {
          dialog.showModal();
        } catch {
          dialog.setAttribute('open', '');
        }
      } else {
        dialog.setAttribute('open', '');
      }
    }

    const handleCancel = (event: Event) => {
      event.preventDefault();
      if (dismissibleRef.current) {
        onCloseRef.current();
      }
    };

    const handleClose = () => {
      // Ignora eventos `close` assíncronos residuais (ex: cleanup do React StrictMode)
      // quando o diálogo já foi reaberto sincronamente.
      if (dialog.open) return;
      if (dialog.returnValue) {
        dialog.returnValue = '';
      }
      if (dismissibleRef.current) {
        onCloseRef.current();
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);

    // Fallback para navegadores sem suporte nativo a `closedby` (ex: Safari)
    const supportsClosedBy =
      typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype;

    let cleanupFallback: (() => void) | undefined;

    if (!supportsClosedBy) {
      let pressedOutside = false;

      const handlePointerDown = (event: PointerEvent) => {
        if (!dismissibleRef.current) {
          pressedOutside = false;
          return;
        }
        pressedOutside =
          event.target === dialog && isOutsideDialogRect(event.clientX, event.clientY, dialog);
      };

      const handlePointerUp = (event: PointerEvent) => {
        if (
          pressedOutside &&
          dismissibleRef.current &&
          event.target === dialog &&
          isOutsideDialogRect(event.clientX, event.clientY, dialog)
        ) {
          pressedOutside = false;
          onCloseRef.current();
        }
      };

      const handleClickFallback = (event: MouseEvent) => {
        if (!dismissibleRef.current || event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (
          (rect.width === 0 && rect.height === 0) ||
          isOutsideDialogRect(event.clientX, event.clientY, dialog)
        ) {
          onCloseRef.current();
        }
      };

      dialog.addEventListener('pointerdown', handlePointerDown);
      dialog.addEventListener('pointerup', handlePointerUp);
      dialog.addEventListener('click', handleClickFallback);

      cleanupFallback = () => {
        dialog.removeEventListener('pointerdown', handlePointerDown);
        dialog.removeEventListener('pointerup', handlePointerUp);
        dialog.removeEventListener('click', handleClickFallback);
      };
    }

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
      cleanupFallback?.();

      if (dialog.open) {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.removeAttribute('open');
        }
      }
    };
  }, [open]);

  if (!open) return null;

  const nativeDialogAttrs = {
    closedby: dismissible ? 'any' : 'none',
  } as Record<string, string>;

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${className}`}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      {...nativeDialogAttrs}
    >
      {children}
    </dialog>
  );
}
