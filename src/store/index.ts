import { create } from 'zustand';

interface AppState {
  // Example state for authentication
  isAuthenticated: boolean;
  token: string | null;
  user: any | null;
  
  // Actions
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  token: null,
  user: null,

  setAuth: (token, user) => set({ isAuthenticated: true, token, user }),
  logout: () => set({ isAuthenticated: false, token: null, user: null }),
}));
