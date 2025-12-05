import { create } from "zustand";

export interface UIState {
  // UI состояние
  selectedTowerLevel: 1 | 2 | 3 | 4 | 5 | null;
  selectedTowerId: string | null; // ID выбранной башни для апгрейда
  isInitialized: boolean;

  // Actions
  setSelectedTowerLevel: (level: 1 | 2 | 3 | 4 | 5 | null) => void;
  setSelectedTowerId: (towerId: string | null) => void;
  setIsInitialized: (initialized: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedTowerLevel: null,
  selectedTowerId: null,
  isInitialized: false,

  setSelectedTowerLevel: (level) => set({ selectedTowerLevel: level }),
  setSelectedTowerId: (towerId) => set({ selectedTowerId: towerId }),
  setIsInitialized: (initialized) => set({ isInitialized: initialized }),
}));
