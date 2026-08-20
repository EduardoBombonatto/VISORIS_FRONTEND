export type RouteGuardAction = { type: 'render' } | { type: 'redirect'; to: string };

export interface RouteGuardInput {
  pathname: string;
}

export function resolvePostAuthRoute({ pathname }: RouteGuardInput): RouteGuardAction {
  if (pathname === '/dashboard') {
    return { type: 'render' };
  }
  return { type: 'redirect', to: '/dashboard' };
}
