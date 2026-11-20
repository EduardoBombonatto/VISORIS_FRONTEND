'use client';

import { useLayoutEffect, useRef } from 'react';
import { setSafeHtml } from '@/lib/sanitize-html';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export default function SafeHtml({ html, className }: SafeHtmlProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setSafeHtml(el, html);
  }, [html]);

  return <div ref={containerRef} className={className} />;
}
