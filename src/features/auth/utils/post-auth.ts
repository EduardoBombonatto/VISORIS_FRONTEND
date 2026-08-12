import type { WorkspaceData } from '@/api/index.schemas';

export type PostAuthDestination = '/workspace' | '/dashboard' | '/onboarding';

export function getPostAuthDestination(workspaces: WorkspaceData[]): PostAuthDestination {
  if (workspaces.length > 1) return '/workspace';
  if (workspaces.length === 1) return '/dashboard';
  return '/onboarding';
}
