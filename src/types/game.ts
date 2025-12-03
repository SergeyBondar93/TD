// Базовые типы для игры Tower Defense

export const WeaponType = {
  PROJECTILE: 'projectile',
  LASER: 'laser',
  ELECTRIC: 'electric',
  FIRE: 'fire',
  ICE: 'ice',
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
  [EnemyType.INFANTRY]: 20,
  [EnemyType.TANK_SMALL]: 40,
  [EnemyType.TANK_MEDIUM]: 50,
  [EnemyType.TANK_LARGE]: 60,
};

import type { EnemyModelConfig } from '../config/enemies';

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
  slowEffect?: number; // Замедление от ледяного оружия (0-1, где 0.2 = 20% замедление)
  rotation?: number; // Угол направления движения в радианах
  isDying?: boolean; // Враг начал анимацию смерти
  deathStartTime?: number; // Время начала анимации смерти
  modelConfig?: EnemyModelConfig; // Конфигурация 3D модели
}

export interface Tower {
  id: string;
  position: Position;
  level: 1 | 2 | 3 | 4 | 5; // 5 уровней башенок
  damage: number;
  range: number;
  fireRate: number; // Выстрелов в секунду
  lastFireTime: number;
  cost: number;
  size: number;
  weaponType: WeaponType; // Тип оружия
  currentTarget?: string; // ID текущей цели (для лазера)
  chainCount?: number; // Количество перескоков для электрического оружия
  areaRadius?: number; // Радиус области поражения для огненного оружия
  slowEffect?: number; // Эффект замедления для ледяного оружия
  slowDuration?: number; // Длительность замедления в мс
  rotation?: number; // Угол поворота башни в радианах
  targetRotation?: number; // Целевой угол поворота для плавного вращения
  upgradeLevel: number; // Уровень улучшения (0-5)
  baseDamage: number; // Базовый урон (для расчета апгрейдов)
  baseRange: number; // Базовая дальность
  baseFireRate: number; // Базовая скорострельность
  buildTimeRemaining: number; // Оставшееся время строительства/улучшения в мс
  upgradeQueue: number; // Количество улучшений в очереди
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

export interface FireProjectile {
  id: string;
  position: Position;
  targetEnemyId: string;
  damage: number;
  speed: number;
  areaRadius: number; // Радиус области поражения
}

export interface FlameStream {
  id: string;
  towerId: string;
  targetEnemyIds: string[]; // Враги в конусе огня
  damage: number; // Урон в секунду
  startTime: number;
  range: number; // Дальность пламени
}

export interface IceProjectile {
  id: string;
  position: Position;
  targetEnemyId: string;
  damage: number;
  speed: number;
  slowEffect: number; // Процент замедления (0.0 - 1.0)
  slowDuration: number; // Длительность замедления в мс
}

export interface IceStream {
  id: string;
  towerId: string;
  targetEnemyIds: string[]; // Враги в конусе льда
  damage: number; // Урон в секунду
  slowEffect: number; // Эффект замедления
  slowDuration: number; // Длительность замедления
  startTime: number;
  range: number;
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
  fireProjectiles: FireProjectile[];
  flameStreams: FlameStream[];
  iceProjectiles: IceProjectile[];
  iceStreams: IceStream[];
  path: Position[];
  gameStatus: 'menu' | 'playing' | 'paused' | 'won' | 'lost';
  selectedTowerLevel: 1 | 2 | 3 | 4 | 5 | null;
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
  level: 1 | 2 | 3 | 4 | 5;
  damage: number;
  range: number;
  fireRate: number;
  cost: number;
  size: number;
  weaponType: WeaponType;
  chainCount?: number; // Количество перескоков для электрического оружия
  areaRadius?: number; // Радиус области поражения для огненного оружия
  slowEffect?: number; // Эффект замедления для ледяного оружия
  slowDuration?: number; // Длительность замедления в мс
  upgradeCost?: number;
}

export const TOWER_STATS: Record<1 | 2 | 3 | 4 | 5, TowerStats> = {
  1: {
    level: 1,
    damage: 10,
    range: 100,
    fireRate: 1, // 1 выстрел в секунду
    cost: 5,
    size: 30,
    weaponType: WeaponType.PROJECTILE,
    upgradeCost: 10,
  },
  2: {
    level: 2,
    damage: 25,
    range: 120,
    fireRate: 1.5,
    cost: 15,
    size: 35,
    weaponType: WeaponType.ELECTRIC,
    chainCount: 3, // Бьет по 3 врагам
    upgradeCost: 20,
  },
  3: {
    level: 3,
    damage: 50,
    range: 150,
    fireRate: 2,
    cost: 35,
    size: 40,
    weaponType: WeaponType.LASER,
    upgradeCost: 30,
  },
  4: {
    level: 4,
    damage: 8, // Маленький урон в секунду, но постоянный
    range: 120,
    fireRate: 10, // 10 тиков в секунду для плавного урона
    cost: 20,
    size: 35,
    weaponType: WeaponType.FIRE,
    areaRadius: 42, // Угол конуса огня (уменьшен на 30%)
    upgradeCost: 25,
  },
  5: {
    level: 5,
    damage: 3, // Очень низкий урон - основная цель замедлять
    range: 130,
    fireRate: 8, // Высокая скорострельность для постоянного замедления
    cost: 40,
    size: 40,
    weaponType: WeaponType.ICE,
    slowEffect: 0.35, // 35% замедление (увеличено)
    slowDuration: 3000, // 3 секунды
    areaRadius: 50, // Угол конуса льда
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
