import { describe, expect, it } from 'vitest';
import { getPostAuthDestination } from './post-auth';
import type { WorkspaceData } from '@/api/index.schemas';

const ws = (clinicId: string): WorkspaceData => ({
  clinicId,
  name: 'Clínica',
  role: 'DOCTOR',
});

describe('getPostAuthDestination', () => {
  it('redireciona para seleção quando há mais de 1 workspace', () => {
    expect(getPostAuthDestination([ws('1'), ws('2')])).toBe('/workspace');
  });

  it('redireciona para o dashboard quando há exatamente 1 workspace', () => {
    expect(getPostAuthDestination([ws('1')])).toBe('/dashboard');
  });

  it('redireciona para o onboarding quando não há workspaces', () => {
    expect(getPostAuthDestination([])).toBe('/onboarding');
  });
});
