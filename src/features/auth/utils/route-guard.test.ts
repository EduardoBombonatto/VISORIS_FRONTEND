import { describe, expect, it } from 'vitest';
import { resolvePostAuthRoute } from './route-guard';
import type { ActiveWorkspace, WorkspaceData } from '@/api/index.schemas';

const ws = (clinicId: string): WorkspaceData => ({
  clinicId,
  name: `Clínica ${clinicId}`,
  role: 'DOCTOR',
});
const active = (clinicId: string): ActiveWorkspace => ({
  clinicId,
  name: `Clínica ${clinicId}`,
  role: 'DOCTOR',
});

describe('resolvePostAuthRoute', () => {
  it('0 workspaces: /onboarding renderiza', () => {
    expect(
      resolvePostAuthRoute({ pathname: '/onboarding', workspaces: [], activeWorkspace: null }),
    ).toEqual({ type: 'render' });
  });

  it('0 workspaces: demais rotas redirecionam para /onboarding', () => {
    expect(
      resolvePostAuthRoute({ pathname: '/dashboard', workspaces: [], activeWorkspace: null }),
    ).toEqual({ type: 'redirect', to: '/onboarding' });
    expect(
      resolvePostAuthRoute({ pathname: '/workspace', workspaces: [], activeWorkspace: null }),
    ).toEqual({ type: 'redirect', to: '/onboarding' });
  });

  it('1 workspace sem ativo: auto-select com clinicId', () => {
    expect(
      resolvePostAuthRoute({
        pathname: '/dashboard',
        workspaces: [ws('10')],
        activeWorkspace: null,
      }),
    ).toEqual({ type: 'auto-select', clinicId: '10' });
  });

  it('1 workspace já ativo: renderiza', () => {
    expect(
      resolvePostAuthRoute({
        pathname: '/dashboard',
        workspaces: [ws('10')],
        activeWorkspace: active('10'),
      }),
    ).toEqual({ type: 'render' });
  });

  it('>1 sem ativo: /workspace renderiza e /dashboard redireciona para /workspace', () => {
    const workspaces = [ws('10'), ws('20')];
    expect(
      resolvePostAuthRoute({ pathname: '/workspace', workspaces, activeWorkspace: null }),
    ).toEqual({ type: 'render' });
    expect(
      resolvePostAuthRoute({ pathname: '/dashboard', workspaces, activeWorkspace: null }),
    ).toEqual({ type: 'redirect', to: '/workspace' });
  });

  it('>1 com ativo: dashboard/workspace renderizam e onboarding redireciona para /dashboard', () => {
    const workspaces = [ws('10'), ws('20')];
    expect(
      resolvePostAuthRoute({
        pathname: '/dashboard',
        workspaces,
        activeWorkspace: active('10'),
      }),
    ).toEqual({ type: 'render' });
    expect(
      resolvePostAuthRoute({ pathname: '/workspace', workspaces, activeWorkspace: active('10') }),
    ).toEqual({ type: 'render' });
    expect(
      resolvePostAuthRoute({
        pathname: '/onboarding',
        workspaces,
        activeWorkspace: active('10'),
      }),
    ).toEqual({ type: 'redirect', to: '/dashboard' });
  });
});
