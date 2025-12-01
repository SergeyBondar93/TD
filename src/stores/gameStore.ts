import { create } from 'zustand';
import type { Enemy, Tower, Projectile } from '../types/game';
import { DEV_CONFIG } from '../config/dev';

export interface GameState {
  // Игровые объекты
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  
  // Игровая информация
  money: number;
  lives: number;
  currentWave: number;
  currentLevel: number | null;
  gameStatus: 'menu' | 'playing' | 'paused' | 'won' | 'lost';
  
  // Настройки
  gameSpeed: number;
  
  // Actions
  setEnemies: (enemies: Enemy[] | ((prev: Enemy[]) => Enemy[])) => void;
  setTowers: (towers: Tower[] | ((prev: Tower[]) => Tower[])) => void;
  setProjectiles: (projectiles: Projectile[] | ((prev: Projectile[]) => Projectile[])) => void;
  addEnemy: (enemy: Enemy) => void;
  addTower: (tower: Tower) => void;
  addProjectile: (projectile: Projectile) => void;
  
  setMoney: (money: number | ((prev: number) => number)) => void;
  setLives: (lives: number | ((prev: number) => number)) => void;
  setCurrentWave: (wave: number) => void;
  setCurrentLevel: (level: number | null) => void;
  setGameStatus: (status: 'menu' | 'playing' | 'paused' | 'won' | 'lost') => void;
  setGameSpeed: (speed: number) => void;
  
  // Комплексные actions
  initializeGame: (levelNumber: number, initialMoney: number, initialLives: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Начальное состояние
  enemies: [],
  towers: [],
  projectiles: [],
  money: 0,
  lives: 0,
  currentWave: 0,
  currentLevel: typeof window !== 'undefined' ? (DEV_CONFIG.AUTO_START_LEVEL ? 1 : null) : null,
  gameStatus: 'menu',
  gameSpeed: typeof window !== 'undefined' ? (DEV_CONFIG.GAME_SPEED || 1) : 1,
  
  // Setters для массивов
  setEnemies: (enemies) =>
    set((state) => ({
      enemies: typeof enemies === 'function' ? enemies(state.enemies) : enemies,
    })),
  
  setTowers: (towers) =>
    set((state) => ({
      towers: typeof towers === 'function' ? towers(state.towers) : towers,
    })),
  
  setProjectiles: (projectiles) =>
    set((state) => ({
      projectiles: typeof projectiles === 'function' ? projectiles(state.projectiles) : projectiles,
    })),
  
  addEnemy: (enemy) =>
    set((state) => ({
      enemies: [...state.enemies, enemy],
    })),
  
  addTower: (tower) =>
    set((state) => ({
      towers: [...state.towers, tower],
    })),
  
  addProjectile: (projectile) =>
    set((state) => ({
      projectiles: [...state.projectiles, projectile],
    })),
  
  // Setters для примитивов
  setMoney: (money) =>
    set((state) => ({
      money: typeof money === 'function' ? money(state.money) : money,
    })),
  
  setLives: (lives) =>
    set((state) => ({
      lives: typeof lives === 'function' ? lives(state.lives) : lives,
    })),
  
  setCurrentWave: (wave) => set({ currentWave: wave }),
  setCurrentLevel: (level) => set({ currentLevel: level }),
  setGameStatus: (status) => set({ gameStatus: status }),
  setGameSpeed: (speed) => set({ gameSpeed: speed }),
  
  // Комплексные actions
  initializeGame: (levelNumber, initialMoney, initialLives) =>
    set({
      currentLevel: levelNumber,
      money: initialMoney,
      lives: initialLives,
      currentWave: 0,
      gameStatus: 'playing',
      enemies: [],
      towers: [],
      projectiles: [],
    }),
  
  resetGame: () =>
    set({
      enemies: [],
      towers: [],
      projectiles: [],
      money: 0,
      lives: 0,
      currentWave: 0,
      currentLevel: null,
      gameStatus: 'menu',
      gameSpeed: 1,
    }),
}));
