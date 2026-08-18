import type { ActiveWorkspace, WorkspaceData } from '@/api/index.schemas';

export type RouteGuardAction =
  { type: 'render' } | { type: 'redirect'; to: string } | { type: 'auto-select'; clinicId: string };

export interface RouteGuardInput {
  pathname: string;
  workspaces: WorkspaceData[];
  activeWorkspace: ActiveWorkspace | null;
}

export function resolvePostAuthRoute({
  pathname,
  workspaces,
  activeWorkspace,
}: RouteGuardInput): RouteGuardAction {
  if (workspaces.length === 0) {
    return pathname === '/onboarding'
      ? { type: 'render' }
      : { type: 'redirect', to: '/onboarding' };
  }

  if (workspaces.length === 1) {
    if (activeWorkspace && activeWorkspace.clinicId === workspaces[0].clinicId) {
      return { type: 'render' };
    }
    return { type: 'auto-select', clinicId: workspaces[0].clinicId };
  }

  if (activeWorkspace === null) {
    return pathname === '/workspace' ? { type: 'render' } : { type: 'redirect', to: '/workspace' };
  }

  if (pathname === '/onboarding') {
    return { type: 'redirect', to: '/dashboard' };
  }

  return { type: 'render' };
}
