import { create } from 'zustand';

export interface UIState {
  // UI состояние
  selectedTowerLevel: 1 | 2 | 3 | null;
  isInitialized: boolean;
  
  // Actions
  setSelectedTowerLevel: (level: 1 | 2 | 3 | null) => void;
  setIsInitialized: (initialized: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedTowerLevel: null,
  isInitialized: false,
  
  setSelectedTowerLevel: (level) => set({ selectedTowerLevel: level }),
  setIsInitialized: (initialized) => set({ isInitialized: initialized }),
}));
