import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './auth-store';
import type { ActiveWorkspace, UserData, WorkspaceData } from '@/api/index.schemas';

const user: UserData = {
  id: '8712345678901234567',
  fullName: 'Dra. Maria Souza',
  professionalDocument: 'CRM/SP 123456',
};
const ws1: WorkspaceData = { clinicId: '10', name: 'Clínica A', role: 'DOCTOR' };
const ws2: WorkspaceData = { clinicId: '20', name: 'Clínica B', role: 'OWNER' };
const active: ActiveWorkspace = { clinicId: '10', name: 'Clínica A', role: 'DOCTOR' };

beforeEach(() => {
  useAuthStore.setState({ user: null, workspaces: [], activeWorkspace: null });
});

describe('auth-store', () => {
  it('setActiveWorkspace define a clínica ativa', () => {
    useAuthStore.getState().setActiveWorkspace(active);
    expect(useAuthStore.getState().activeWorkspace).toEqual(active);
  });

  it('addWorkspace adiciona à lista de workspaces', () => {
    useAuthStore.getState().setSession(user, [ws1]);
    useAuthStore.getState().addWorkspace(ws2);
    expect(useAuthStore.getState().workspaces).toEqual([ws1, ws2]);
  });

  it('logout zera user, workspaces e activeWorkspace', () => {
    useAuthStore.getState().setSession(user, [ws1, ws2]);
    useAuthStore.getState().setActiveWorkspace(active);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().workspaces).toEqual([]);
    expect(useAuthStore.getState().activeWorkspace).toBeNull();
  });
});
