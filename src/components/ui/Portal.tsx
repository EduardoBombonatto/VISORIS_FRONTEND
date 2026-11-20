'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
}

const emptySubscribe = () => () => {};

export default function Portal({ children }: PortalProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!isClient || typeof document === 'undefined') return null;

  return createPortal(children, document.body);
}
