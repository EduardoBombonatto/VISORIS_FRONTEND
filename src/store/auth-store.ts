import { create } from 'zustand';
import type { ActiveWorkspace, UserData, WorkspaceData } from '@/api/index.schemas';

interface AuthState {
  user: UserData | null;
  workspaces: WorkspaceData[];
  activeWorkspace: ActiveWorkspace | null;
  setSession: (user: UserData, workspaces: WorkspaceData[]) => void;
  addWorkspace: (workspace: WorkspaceData) => void;
  setActiveWorkspace: (workspace: ActiveWorkspace) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  workspaces: [],
  activeWorkspace: null,
  setSession: (user, workspaces) => set({ user, workspaces }),
  addWorkspace: (workspace) => set((state) => ({ workspaces: [...state.workspaces, workspace] })),
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  logout: () => set({ user: null, workspaces: [], activeWorkspace: null }),
}));
