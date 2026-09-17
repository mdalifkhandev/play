import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  // Example state for authentication
  isAuthenticated: boolean;
  hasHydrated: boolean;
  token: string | null;
  refreshToken: string | null;
  user: any | null;
  
  // Kids Mode state
  isKidsModeActive: boolean;
  kidsModeExpireTimestamp: number | null;
  kidsModeDurationMs: number | null;
  
  // Coin System
  coinBalance: number;
  
  // Feed refresh trigger
  homeRefreshTrigger: number;
  triggerHomeRefresh: () => void;

  // Actions
  setAuth: (token: string, refreshToken: string, user: any) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setKidsModeActive: (active: boolean) => void;
  setKidsModeExpireTime: (timestamp: number | null) => void;
  setKidsModeDuration: (durationMs: number | null) => void;
  setCoinBalance: (amount: number) => void;
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => boolean;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      hasHydrated: false,
      token: null,
      refreshToken: null,
      user: null,
      isKidsModeActive: false,
      kidsModeExpireTimestamp: null,
      kidsModeDurationMs: null,
      coinBalance: 0,
      homeRefreshTrigger: 0,

      triggerHomeRefresh: () => set((state) => ({ homeRefreshTrigger: state.homeRefreshTrigger + 1 })),
      setAuth: (token, refreshToken, user) => set({ isAuthenticated: true, token, refreshToken, user }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setKidsModeActive: (active: boolean) => set((state) => {
        if (active) {
          return { isKidsModeActive: true };
        }
        return { isKidsModeActive: false, kidsModeExpireTimestamp: null, kidsModeDurationMs: null };
      }),
      setKidsModeExpireTime: (timestamp: number | null) => set({ kidsModeExpireTimestamp: timestamp }),
      setKidsModeDuration: (durationMs: number | null) => set({ kidsModeDurationMs: durationMs }),
      
      setCoinBalance: (amount: number) => set({ coinBalance: Math.max(0, amount) }),
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
        refreshToken: null,
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
