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
  
  // Coin System
  coinBalance: number;
  
  // Actions
  setAuth: (token: string, user: any) => void;
  setKidsModeActive: (active: boolean) => void;
  setKidsModeExpireTime: (timestamp: number | null) => void;
  setKidsModeDuration: (durationMs: number | null) => void;
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => boolean;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      isKidsModeActive: false,
      kidsModeExpireTimestamp: null,
      kidsModeDurationMs: null,
      coinBalance: 0,

      setAuth: (token, user) => set({ isAuthenticated: true, token, user }),
      setKidsModeActive: (active: boolean) => set((state) => {
        if (active) {
          return { isKidsModeActive: true };
        }
        return { isKidsModeActive: false, kidsModeExpireTimestamp: null, kidsModeDurationMs: null };
      }),
      setKidsModeExpireTime: (timestamp: number | null) => set({ kidsModeExpireTimestamp: timestamp }),
      setKidsModeDuration: (durationMs: number | null) => set({ kidsModeDurationMs: durationMs }),
      
      addCoins: (amount: number) => set((state) => ({ coinBalance: state.coinBalance + amount })),
      deductCoins: (amount: number) => {
        const state = get();
        if (state.coinBalance >= amount) {
          set({ coinBalance: state.coinBalance - amount });
          return true; // Success
        }
        return false; // Insufficient funds
      },

      logout: () => set({ 
        isAuthenticated: false, 
        token: null, 
        user: null, 
        isKidsModeActive: false,
        kidsModeExpireTimestamp: null,
        kidsModeDurationMs: null,
        coinBalance: 0
      }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
