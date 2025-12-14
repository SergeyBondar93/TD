import { create } from "zustand";
import type {
  Enemy,
  Tower,
  Projectile,
  LaserBeam,
  ElectricChain,
  FireProjectile,
  FlameStream,
  IceProjectile,
  IceStream,
} from "../types/game";
import { DEV_CONFIG } from "../config/dev";

export interface GameState {
  // Игровые объекты
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  laserBeams: LaserBeam[];
  electricChains: ElectricChain[];
  fireProjectiles: FireProjectile[];
  flameStreams: FlameStream[];
  iceProjectiles: IceProjectile[];
  iceStreams: IceStream[];

  // Игровая информация
  money: number;
  lives: number;
  currentWave: number;
  currentLevel: number | null;
  gameStatus: "menu" | "playing" | "paused" | "won" | "lost";

  // Настройки
  gameSpeed: number;

  // Actions
  setEnemies: (enemies: Enemy[] | ((prev: Enemy[]) => Enemy[])) => void;
  setTowers: (towers: Tower[] | ((prev: Tower[]) => Tower[])) => void;
  setProjectiles: (
    projectiles: Projectile[] | ((prev: Projectile[]) => Projectile[])
  ) => void;
  setLaserBeams: (
    laserBeams: LaserBeam[] | ((prev: LaserBeam[]) => LaserBeam[])
  ) => void;
  setElectricChains: (
    electricChains:
      | ElectricChain[]
      | ((prev: ElectricChain[]) => ElectricChain[])
  ) => void;
  setFireProjectiles: (
    fireProjectiles:
      | FireProjectile[]
      | ((prev: FireProjectile[]) => FireProjectile[])
  ) => void;
  setFlameStreams: (
    flameStreams: FlameStream[] | ((prev: FlameStream[]) => FlameStream[])
  ) => void;
  setIceProjectiles: (
    iceProjectiles:
      | IceProjectile[]
      | ((prev: IceProjectile[]) => IceProjectile[])
  ) => void;
  setIceStreams: (
    iceStreams: IceStream[] | ((prev: IceStream[]) => IceStream[])
  ) => void;
  addEnemy: (enemy: Enemy) => void;
  addTower: (tower: Tower) => void;
  addProjectile: (projectile: Projectile) => void;
  addLaserBeam: (laserBeam: LaserBeam) => void;
  addElectricChain: (electricChain: ElectricChain) => void;
  addFireProjectile: (fireProjectile: FireProjectile) => void;
  addFlameStream: (flameStream: FlameStream) => void;
  addIceProjectile: (iceProjectile: IceProjectile) => void;
  addIceStream: (iceStream: IceStream) => void;

  setMoney: (money: number | ((prev: number) => number)) => void;
  setLives: (lives: number | ((prev: number) => number)) => void;
  setCurrentWave: (wave: number) => void;
  setCurrentLevel: (level: number | null) => void;
  setGameStatus: (
    status: "menu" | "playing" | "paused" | "won" | "lost"
  ) => void;
  setGameSpeed: (speed: number) => void;

  // Комплексные actions
  initializeGame: (
    levelNumber: number,
    initialMoney: number,
    initialLives: number
  ) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Начальное состояние
  enemies: [],
  towers: [],
  projectiles: [],
  laserBeams: [],
  electricChains: [],
  fireProjectiles: [],
  flameStreams: [],
  iceProjectiles: [],
  iceStreams: [],
  money: 0,
  lives: 0,
  currentWave: 0,
  currentLevel:
    typeof window !== "undefined"
      ? (DEV_CONFIG as any).AUTO_START_LEVEL
        ? 1
        : null
      : null,
  gameStatus: "menu",
  gameSpeed: typeof window !== "undefined" ? DEV_CONFIG.GAME_SPEED || 1 : 1,

  // Setters для массивов
  setEnemies: (enemies) =>
    set((state) => ({
      enemies: typeof enemies === "function" ? enemies(state.enemies) : enemies,
    })),

  setTowers: (towers) =>
    set((state) => ({
      towers: typeof towers === "function" ? towers(state.towers) : towers,
    })),

  setProjectiles: (projectiles) =>
    set((state) => ({
      projectiles:
        typeof projectiles === "function"
          ? projectiles(state.projectiles)
          : projectiles,
    })),

  setLaserBeams: (laserBeams) =>
    set((state) => ({
      laserBeams:
        typeof laserBeams === "function"
          ? laserBeams(state.laserBeams)
          : laserBeams,
    })),

  setElectricChains: (electricChains) =>
    set((state) => ({
      electricChains:
        typeof electricChains === "function"
          ? electricChains(state.electricChains)
          : electricChains,
    })),

  setFireProjectiles: (fireProjectiles) =>
    set((state) => ({
      fireProjectiles:
        typeof fireProjectiles === "function"
          ? fireProjectiles(state.fireProjectiles)
          : fireProjectiles,
    })),

  setFlameStreams: (flameStreams) =>
    set((state) => ({
      flameStreams:
        typeof flameStreams === "function"
          ? flameStreams(state.flameStreams)
          : flameStreams,
    })),

  setIceProjectiles: (iceProjectiles) =>
    set((state) => ({
      iceProjectiles:
        typeof iceProjectiles === "function"
          ? iceProjectiles(state.iceProjectiles)
          : iceProjectiles,
    })),

  setIceStreams: (iceStreams) =>
    set((state) => ({
      iceStreams:
        typeof iceStreams === "function"
          ? iceStreams(state.iceStreams)
          : iceStreams,
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

  addLaserBeam: (laserBeam) =>
    set((state) => ({
      laserBeams: [...state.laserBeams, laserBeam],
    })),

  addElectricChain: (electricChain) =>
    set((state) => ({
      electricChains: [...state.electricChains, electricChain],
    })),

  addFireProjectile: (fireProjectile) =>
    set((state) => ({
      fireProjectiles: [...state.fireProjectiles, fireProjectile],
    })),

  addFlameStream: (flameStream) =>
    set((state) => ({
      flameStreams: [...state.flameStreams, flameStream],
    })),

  addIceProjectile: (iceProjectile) =>
    set((state) => ({
      iceProjectiles: [...state.iceProjectiles, iceProjectile],
    })),

  addIceStream: (iceStream) =>
    set((state) => ({
      iceStreams: [...state.iceStreams, iceStream],
    })),

  // Setters для примитивов
  setMoney: (money) =>
    set((state) => ({
      money: typeof money === "function" ? money(state.money) : money,
    })),

  setLives: (lives) =>
    set((state) => ({
      lives: typeof lives === "function" ? lives(state.lives) : lives,
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
      gameStatus: "playing",
      enemies: [],
      towers: [],
      projectiles: [],
      laserBeams: [],
      electricChains: [],
      fireProjectiles: [],
      flameStreams: [],
      iceProjectiles: [],
      iceStreams: [],
    }),

  resetGame: () =>
    set({
      enemies: [],
      towers: [],
      projectiles: [],
      laserBeams: [],
      electricChains: [],
      fireProjectiles: [],
      flameStreams: [],
      iceProjectiles: [],
      iceStreams: [],
      money: 0,
      lives: 0,
      currentWave: 0,
      currentLevel: null,
      gameStatus: "menu",
      gameSpeed: 1,
    }),
}));
