// Базовые типы для игры Tower Defense

export const WeaponType = {
  PROJECTILE: 'projectile',
  LASER: 'laser',
  ELECTRIC: 'electric',
} as const;

export type WeaponType = typeof WeaponType[keyof typeof WeaponType];

export const EnemyType = {
  INFANTRY: 'infantry',
  TANK_SMALL: 'tank_small',
  TANK_MEDIUM: 'tank_medium',
  TANK_LARGE: 'tank_large',
} as const;

export type EnemyType = typeof EnemyType[keyof typeof EnemyType];

export const ENEMY_SIZES: Record<EnemyType, number> = {
  [EnemyType.INFANTRY]: 5,
  [EnemyType.TANK_SMALL]: 30,
  [EnemyType.TANK_MEDIUM]: 40,
  [EnemyType.TANK_LARGE]: 50,
};

export interface Position {
  x: number;
  y: number;
}

export interface Enemy {
  id: string;
  position: Position;
  health: number;
  maxHealth: number;
  speed: number;
  level: number; // Уровень сложности врага
  pathIndex: number; // Индекс текущей точки на пути
  reward: number; // Награда за уничтожение
  type: EnemyType; // Тип врага
  size: number; // Размер врага
  pathOffset: number; // Смещение относительно центра пути (для пехоты)
  turnPoints?: Position[]; // Точки где был совершен поворот (для отладки)
}

export interface Tower {
  id: string;
  position: Position;
  level: 1 | 2 | 3; // 3 уровня башенок
  damage: number;
  range: number;
  fireRate: number; // Выстрелов в секунду
  lastFireTime: number;
  cost: number;
  size: number;
  weaponType: WeaponType; // Тип оружия
  currentTarget?: string; // ID текущей цели (для лазера)
  chainCount?: number; // Количество перескоков для электрического оружия
}

export interface Projectile {
  id: string;
  position: Position;
  targetEnemyId: string;
  damage: number;
  speed: number;
}

export interface LaserBeam {
  id: string;
  towerId: string;
  targetEnemyId: string;
  damage: number;
  startTime: number;
}

export interface ElectricChain {
  id: string;
  towerId: string;
  targetEnemyIds: string[]; // Цепь врагов
  damage: number;
  startTime: number;
  chainCount: number; // Количество перескоков
}

export interface GameState {
  money: number;
  lives: number;
  currentWave: number;
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  laserBeams: LaserBeam[];
  electricChains: ElectricChain[];
  path: Position[];
  gameStatus: 'menu' | 'playing' | 'paused' | 'won' | 'lost';
  selectedTowerLevel: 1 | 2 | 3 | null;
  currentLevel: number; // 1-10 уровней сложности
  gameSpeed: number; // Скорость игры от 0.05 до 3.0
}

export interface LevelConfig {
  level: number;
  waves: WaveConfig[];
  startingMoney: number;
  startingLives: number;
}

export interface WaveConfig {
  enemyCount: number;
  enemyLevel: number;
  enemyHealth: number;
  enemySpeed: number;
  enemyReward: number;
  spawnDelay: number; // Задержка между спавном врагов (мс)
  enemyType: EnemyType; // Тип врагов в этой волне
}

export interface TowerStats {
  level: 1 | 2 | 3;
  damage: number;
  range: number;
  fireRate: number;
  cost: number;
  size: number;
  weaponType: WeaponType;
  chainCount?: number; // Количество перескоков для электрического оружия
  upgradeCost?: number;
}

export const TOWER_STATS: Record<1 | 2 | 3, TowerStats> = {
  1: {
    level: 1,
    damage: 10,
    range: 100,
    fireRate: 1, // 1 выстрел в секунду
    cost: 50,
    size: 30,
    weaponType: WeaponType.PROJECTILE,
    upgradeCost: 100,
  },
  2: {
    level: 2,
    damage: 25,
    range: 120,
    fireRate: 1.5,
    cost: 150,
    size: 35,
    weaponType: WeaponType.ELECTRIC,
    chainCount: 3, // Бьет по 3 врагам
    upgradeCost: 200,
  },
  3: {
    level: 3,
    damage: 50,
    range: 150,
    fireRate: 2,
    cost: 350,
    size: 40,
    weaponType: WeaponType.LASER,
  },
};

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const CANVAS_PADDING = 30;
export const GAME_WIDTH = CANVAS_WIDTH - CANVAS_PADDING * 2;
export const GAME_HEIGHT = CANVAS_HEIGHT - CANVAS_PADDING * 2;
export const CELL_SIZE = 40;
export const ENEMY_SIZE = 30;
export const TOWER_SIZE = 35;
export const PROJECTILE_SIZE = 8;
export const PROJECTILE_SPEED = 300; // пикселей в секунду
