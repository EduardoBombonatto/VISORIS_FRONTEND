'use client';

import { useParams } from 'next/navigation';
import TemplateWorkspace from '@/features/templates/components/TemplateWorkspace';

export default function EditTemplatePage() {
  const params = useParams();
  const id =
    typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  return <TemplateWorkspace initialTemplateId={id} />;
}
