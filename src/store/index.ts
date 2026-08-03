import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  // Example state for authentication
  isAuthenticated: boolean;
  token: string | null;
  user: any | null;
  
  // Kids Mode state
  isKidsModeActive: boolean;
  
  // Actions
  setAuth: (token: string, user: any) => void;
  setKidsModeActive: (active: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      isKidsModeActive: false,

      setAuth: (token, user) => set({ isAuthenticated: true, token, user }),
      setKidsModeActive: (active: boolean) => set({ isKidsModeActive: active }),
      logout: () => set({ isAuthenticated: false, token: null, user: null, isKidsModeActive: false }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
