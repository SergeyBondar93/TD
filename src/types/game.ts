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
import { DEV_CONFIG } from '../config/dev';
import { GAME_SETTINGS } from '../config/settings';

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
  modelConfig: EnemyModelConfig; // Конфигурация 3D модели врага
}

export interface TowerStats {
  level: 1 | 2 | 3 | 4 | 5;
  upgradeLevel: number; // 0-5
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
  buildTime: number; // Время строительства/улучшения в мс
}

// Функция для генерации всех уровней улучшений башни
function generateTowerUpgrades(baseTower: TowerStats, maxUpgrades: number = 5): TowerStats[] {
  const upgrades: TowerStats[] = [];
  const { UPGRADE_DAMAGE_MULTIPLIER, UPGRADE_RANGE_MULTIPLIER, UPGRADE_FIRE_RATE_MULTIPLIER, UPGRADE_COST_MULTIPLIER, BASE_UPGRADE_TIME } = GAME_SETTINGS;
  
  for (let i = 0; i <= maxUpgrades; i++) {
    upgrades.push({
      ...baseTower,
      upgradeLevel: i,
      damage: baseTower.damage * Math.pow(UPGRADE_DAMAGE_MULTIPLIER, i),
      range: baseTower.range * Math.pow(UPGRADE_RANGE_MULTIPLIER, i),
      fireRate: baseTower.fireRate * Math.pow(UPGRADE_FIRE_RATE_MULTIPLIER, i),
      upgradeCost: i < maxUpgrades ? baseTower.upgradeCost! * Math.pow(UPGRADE_COST_MULTIPLIER, i) : undefined,
      buildTime: i === 0 ? baseTower.buildTime : BASE_UPGRADE_TIME * 1000, // Базовое строительство или фиксированное время улучшения
    });
  }
  
  return upgrades;
}

// Базовые характеристики башен (уровень улучшения 0)
const BASE_TOWER_STATS: Record<1 | 2 | 3 | 4 | 5, TowerStats> = {
  1: {
    level: 1,
    upgradeLevel: 0,
    damage: 10,
    range: 100,
    fireRate: 1, // 1 выстрел в секунду
    cost: 5,
    size: 30,
    weaponType: WeaponType.PROJECTILE,
    upgradeCost: 10,
    buildTime: (DEV_CONFIG.DEV_BUILD_TIME || GAME_SETTINGS.BASE_BUILD_TIME) * 1000 * 1, // Время строительства уровня 1
  },
  2: {
    level: 2,
    upgradeLevel: 0,
    damage: 1, // Урон за один выстрел
    range: 120,
    fireRate: 20, // 20 выстрелов в секунду = 20 урона/сек
    cost: 15,
    size: 35,
    weaponType: WeaponType.ELECTRIC,
    chainCount: 3, // Бьет по 3 врагам
    upgradeCost: 20,
    buildTime: (DEV_CONFIG.DEV_BUILD_TIME || GAME_SETTINGS.BASE_BUILD_TIME) * 1000 * 2, // Время строительства уровня 2
  },
  3: {
    level: 3,
    upgradeLevel: 0,
    damage: 1, // Урон за один выстрел
    range: 150,
    fireRate: 100, // 100 выстрелов в секунду = 100 урона/сек
    cost: 35,
    size: 40,
    weaponType: WeaponType.LASER,
    upgradeCost: 30,
    buildTime: (DEV_CONFIG.DEV_BUILD_TIME || GAME_SETTINGS.BASE_BUILD_TIME) * 1000 * 3, // Время строительства уровня 3
  },
  4: {
    level: 4,
    upgradeLevel: 0,
    damage: 2, // Урон за один выстрел
    range: 120,
    fireRate: 20, // 20 выстрелов в секунду = 40 урона/сек
    cost: 20,
    size: 35,
    weaponType: WeaponType.FIRE,
    areaRadius: 42, // Угол конуса огня (уменьшен на 30%)
    upgradeCost: 25,
    buildTime: (DEV_CONFIG.DEV_BUILD_TIME || GAME_SETTINGS.BASE_BUILD_TIME) * 1000 * 4, // Время строительства уровня 4
  },
  5: {
    level: 5,
    upgradeLevel: 0,
    damage: 1, // Урон за один выстрел
    range: 130,
    fireRate: 10, // 10 выстрелов в секунду = 10 урона/сек
    cost: 40,
    size: 40,
    weaponType: WeaponType.ICE,
    slowEffect: 0.35, // 35% замедление (увеличено)
    slowDuration: 3000, // 3 секунды
    areaRadius: 50, // Угол конуса льда
    upgradeCost: 40,
    buildTime: (DEV_CONFIG.DEV_BUILD_TIME || GAME_SETTINGS.BASE_BUILD_TIME) * 1000 * 5, // Время строительства уровня 5
  },
};

// Все уровни башен со всеми их улучшениями
// Структура: TOWER_STATS[towerLevel][upgradeLevel]
export const TOWER_STATS: Record<1 | 2 | 3 | 4 | 5, TowerStats[]> = {
  1: generateTowerUpgrades(BASE_TOWER_STATS[1]),
  2: generateTowerUpgrades(BASE_TOWER_STATS[2]),
  3: generateTowerUpgrades(BASE_TOWER_STATS[3]),
  4: generateTowerUpgrades(BASE_TOWER_STATS[4]),
  5: generateTowerUpgrades(BASE_TOWER_STATS[5]),
};

// Helper функция для создания башни из конфига
export function createTowerFromStats(params: {
  id: string;
  position: Position;
  towerLevel: 1 | 2 | 3 | 4 | 5;
  upgradeLevel?: number;
}): Tower {
  const { id, position, towerLevel, upgradeLevel = 0 } = params;
  const stats = TOWER_STATS[towerLevel][upgradeLevel];
  const baseStats = TOWER_STATS[towerLevel][0];
  
  return {
    id,
    position,
    ...stats, // Все характеристики из конфига (damage, range, fireRate, cost, size, weaponType, buildTime, etc.)
    lastFireTime: 0,
    rotation: 0,
    targetRotation: 0,
    baseDamage: baseStats.damage,
    baseRange: baseStats.range,
    baseFireRate: baseStats.fireRate,
    buildTimeRemaining: stats.buildTime, // Берём из конфига
    upgradeQueue: 0,
  };
}

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
