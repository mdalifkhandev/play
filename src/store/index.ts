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
  kidsModeExpireTimestamp: number | null;
  kidsModeDurationMs: number | null;
  
  // Actions
  setAuth: (token: string, user: any) => void;
  setKidsModeActive: (active: boolean) => void;
  setKidsModeExpireTime: (timestamp: number | null) => void;
  setKidsModeDuration: (durationMs: number | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      isKidsModeActive: false,
      kidsModeExpireTimestamp: null,
      kidsModeDurationMs: null,

      setAuth: (token, user) => set({ isAuthenticated: true, token, user }),
      setKidsModeActive: (active: boolean) => set((state) => {
        if (active) {
          return { isKidsModeActive: true };
        }
        return { isKidsModeActive: false, kidsModeExpireTimestamp: null, kidsModeDurationMs: null };
      }),
      setKidsModeExpireTime: (timestamp: number | null) => set({ kidsModeExpireTimestamp: timestamp }),
      setKidsModeDuration: (durationMs: number | null) => set({ kidsModeDurationMs: durationMs }),
      logout: () => set({ 
        isAuthenticated: false, 
        token: null, 
        user: null, 
        isKidsModeActive: false,
        kidsModeExpireTimestamp: null,
        kidsModeDurationMs: null
      }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
