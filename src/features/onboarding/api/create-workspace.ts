// TEMP/TODO(#003): mock temporário até o backend expor o endpoint de criação de workspace.
import { useMutation } from '@tanstack/react-query';
import type { WorkspaceData } from '@/api/index.schemas';
import { ApiError } from '@/lib/axios';

function generateClinicId(): string {
  return String(Date.now());
}

export async function createWorkspaceTemporary(name: string): Promise<WorkspaceData> {
  await new Promise<void>((resolve) => setTimeout(resolve, 300));
  return { clinicId: generateClinicId(), name, role: 'OWNER' };
}

export function useCreateWorkspace() {
  return useMutation<WorkspaceData, ApiError, { name: string }>({
    mutationFn: ({ name }) => createWorkspaceTemporary(name),
  });
}
