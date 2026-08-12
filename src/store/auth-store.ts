import { create } from 'zustand';
import type { UserData, WorkspaceData } from '@/api/index.schemas';

interface AuthState {
  user: UserData | null;
  workspaces: WorkspaceData[];
  setSession: (user: UserData, workspaces: WorkspaceData[]) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  workspaces: [],
  setSession: (user, workspaces) => set({ user, workspaces }),
  reset: () => set({ user: null, workspaces: [] }),
}));
