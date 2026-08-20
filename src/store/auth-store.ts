import { create } from 'zustand';
import type { UserData } from '@/api/index.schemas';

interface AuthState {
  user: UserData | null;
  setSession: (user: UserData) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setSession: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
