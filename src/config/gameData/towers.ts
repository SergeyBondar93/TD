import { WeaponType } from '../../types/game';
import type { Position, Tower } from '../../types/game';
import { DEV_CONFIG } from '../dev';
import { GAME_SETTINGS } from '../settings';

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
