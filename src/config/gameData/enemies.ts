import { EnemyType } from "../../types/game";

// Типы анимаций врагов
export interface EnemyAnimation {
  walk: {
    enabled: boolean;
    // Параметры процедурной анимации ходьбы
    bobAmount?: number; // Амплитуда покачивания вверх-вниз
    swayAmount?: number; // Амплитуда покачивания в стороны
    tiltAmount?: number; // Угол наклона
    speed?: number; // Скорость анимации
  };
  death: {
    duration: number; // Длительность анимации смерти в секундах
    fadeOutDuration: number; // Длительность растворения после смерти
    // Параметры анимации смерти
    flipOver?: boolean; // Переворачиваться на спину
    explode?: boolean; // Взрыв
    shrink?: boolean; // Уменьшение
    knockbackDistance?: number; // Расстояние отлета (в пикселях)
  };
}

// Конфигурация 3D модели врага
export interface EnemyModelConfig {
  modelType: "spider" | "wolf" | "cube"; // Тип модели
  modelPath?: string; // Путь к модели (если не стандартная)
  scale: number; // Масштаб модели
  rotationOffset?: number; // Смещение вращения (если модель смотрит не туда)
  animations: EnemyAnimation; // Анимации
}

// Базовый класс врага
export interface EnemyClass {
  id: string;
  name: string;
  type: EnemyType;
  baseHealth: number;
  baseSpeed: number;
  baseReward: number;
  spawnDelay: number;
  modelConfig: EnemyModelConfig; // Конфигурация 3D модели
}

// Константы задержки спавна для разных типов врагов
const SPAWN_DELAY = {
  INFANTRY: 80,
  TANK_SMALL: 700,
  TANK_MEDIUM: 750,
  TANK_LARGE: 800,
} as const;

// ============================================
// СТАНДАРТНЫЕ КОНФИГУРАЦИИ МОДЕЛЕЙ
// ============================================

export const SPIDER_MODEL: EnemyModelConfig = {
  modelType: "spider",
  scale: 0.02,
  rotationOffset: Math.PI, // Паук смотрит назад, поворачиваем на 180°
  animations: {
    walk: {
      enabled: true,
      bobAmount: 0.15, // Покачивание вверх-вниз
      swayAmount: 0.12, // Покачивание в стороны
      tiltAmount: 0.15, // Наклон
      speed: 40, // Скорость анимации
    },
    death: {
      duration: 2.0, // 2 секунды переворачивания
      fadeOutDuration: 1.0, // 1 секунда растворения
      flipOver: true, // Переворачивается на спину
      knockbackDistance: 15, // Отлетает на 8 единиц (уменьшено чтобы не обрезался)
    },
  },
};

const WOLF_MODEL: EnemyModelConfig = {
  modelType: "wolf",
  scale: 0.03,
  rotationOffset: Math.PI / 2,
  animations: {
    walk: {
      enabled: true,
      bobAmount: 0.03,
      swayAmount: 0.01,
      tiltAmount: 0.03,
      speed: 6,
    },
    death: {
      duration: 1.5,
      fadeOutDuration: 1.0,
      shrink: true, // Уменьшается
    },
  },
};

const CUBE_MODEL: EnemyModelConfig = {
  modelType: "cube",
  scale: 0.5,
  animations: {
    walk: {
      enabled: true,
      bobAmount: 0.1,
      speed: 4,
    },
    death: {
      duration: 1.0,
      fadeOutDuration: 0.5,
      explode: true, // Взрывается
    },
  },
};

// ============================================
// 15 БАЗОВЫХ ТИПОВ ВРАГОВ
// Используются на всех уровнях с модификаторами
// ============================================

// --- ПЕХОТА (5 типов) ---
const SCOUT: EnemyClass = {
  id: "scout",
  name: "Разведчик",
  type: EnemyType.INFANTRY,
  baseHealth: 8,
  baseSpeed: 75,
  baseReward: 1,
  spawnDelay: SPAWN_DELAY.INFANTRY,
  modelConfig: SPIDER_MODEL,
};

const SOLDIER: EnemyClass = {
  id: "soldier",
  name: "Солдат",
  type: EnemyType.INFANTRY,
  baseHealth: 12,
  baseSpeed: 60,
  baseReward: 1,
  spawnDelay: SPAWN_DELAY.INFANTRY,
  modelConfig: SPIDER_MODEL,
};

const VETERAN: EnemyClass = {
  id: "veteran",
  name: "Ветеран",
  type: EnemyType.INFANTRY,
  baseHealth: 18,
  baseSpeed: 55,
  baseReward: 2,
  spawnDelay: SPAWN_DELAY.INFANTRY,
  modelConfig: SPIDER_MODEL,
};

const COMMANDO: EnemyClass = {
  id: "commando",
  name: "Коммандо",
  type: EnemyType.INFANTRY,
  baseHealth: 15,
  baseSpeed: 85,
  baseReward: 2,
  spawnDelay: SPAWN_DELAY.INFANTRY,
  modelConfig: SPIDER_MODEL,
};

const HEAVY_INFANTRY: EnemyClass = {
  id: "heavy_infantry",
  name: "Тяжелая пехота",
  type: EnemyType.INFANTRY,
  baseHealth: 25,
  baseSpeed: 50,
  baseReward: 2,
  spawnDelay: SPAWN_DELAY.INFANTRY,
  modelConfig: SPIDER_MODEL,
};

// --- ЛЕГКИЕ ТАНКИ (3 типа) ---
const LIGHT_TANK: EnemyClass = {
  id: "light_tank",
  name: "Легкий танк",
  type: EnemyType.TANK_SMALL,
  baseHealth: 100,
  baseSpeed: 55,
  baseReward: 3,
  spawnDelay: SPAWN_DELAY.TANK_SMALL,
  modelConfig: SPIDER_MODEL,
};

const FAST_TANK: EnemyClass = {
  id: "fast_tank",
  name: "Скоростной танк",
  // TODO temporary
  type: EnemyType.TANK_LARGE,
  baseHealth: 80,
  baseSpeed: 70,
  baseReward: 3,
  spawnDelay: SPAWN_DELAY.TANK_SMALL,
  modelConfig: SPIDER_MODEL,
};

const ARMORED_TRANSPORT: EnemyClass = {
  id: "armored_transport",
  name: "Бронетранспортер",
  type: EnemyType.TANK_SMALL,
  baseHealth: 120,
  baseSpeed: 50,
  baseReward: 4,
  spawnDelay: SPAWN_DELAY.TANK_SMALL,
  modelConfig: SPIDER_MODEL,
};

// --- СРЕДНИЕ ТАНКИ (4 типа) ---
const MEDIUM_TANK: EnemyClass = {
  id: "medium_tank",
  name: "Средний танк",
  type: EnemyType.TANK_MEDIUM,
  baseHealth: 200,
  baseSpeed: 50,
  baseReward: 5,
  spawnDelay: SPAWN_DELAY.TANK_MEDIUM,
  modelConfig: SPIDER_MODEL,
};

const BATTLE_TANK: EnemyClass = {
  id: "battle_tank",
  name: "Боевой танк",
  type: EnemyType.TANK_MEDIUM,
  baseHealth: 250,
  baseSpeed: 55,
  baseReward: 6,
  spawnDelay: SPAWN_DELAY.TANK_MEDIUM,
  modelConfig: SPIDER_MODEL,
};

const ASSAULT_TANK: EnemyClass = {
  id: "assault_tank",
  name: "Штурмовой танк",
  type: EnemyType.TANK_MEDIUM,
  baseHealth: 220,
  baseSpeed: 60,
  baseReward: 6,
  spawnDelay: SPAWN_DELAY.TANK_MEDIUM,
  modelConfig: SPIDER_MODEL,
};

const SIEGE_TANK: EnemyClass = {
  id: "siege_tank",
  name: "Осадный танк",
  type: EnemyType.TANK_MEDIUM,
  baseHealth: 300,
  baseSpeed: 45,
  baseReward: 7,
  spawnDelay: SPAWN_DELAY.TANK_MEDIUM,
  modelConfig: SPIDER_MODEL,
};

// --- ТЯЖЕЛЫЕ ТАНКИ (3 типа) ---
const HEAVY_TANK: EnemyClass = {
  id: "heavy_tank",
  name: "Тяжелый танк",
  type: EnemyType.TANK_LARGE,
  baseHealth: 400,
  baseSpeed: 45,
  baseReward: 8,
  spawnDelay: SPAWN_DELAY.TANK_LARGE,
  modelConfig: SPIDER_MODEL,
};

const BEHEMOTH: EnemyClass = {
  id: "behemoth",
  name: "Бегемот",
  type: EnemyType.TANK_LARGE,
  baseHealth: 500,
  baseSpeed: 40,
  baseReward: 10,
  spawnDelay: SPAWN_DELAY.TANK_LARGE,
  modelConfig: SPIDER_MODEL,
};

const JUGGERNAUT: EnemyClass = {
  id: "juggernaut",
  name: "Джаггернаут",
  type: EnemyType.TANK_LARGE,
  baseHealth: 600,
  baseSpeed: 35,
  baseReward: 12,
  spawnDelay: SPAWN_DELAY.TANK_LARGE,
  modelConfig: SPIDER_MODEL,
};

// --- БОСС ---
const BOSS: EnemyClass = {
  id: "boss",
  name: "ИМПЕРАТОР РАЗРУШЕНИЯ",
  type: EnemyType.TANK_LARGE,
  baseHealth: 10000,
  baseSpeed: 30,
  baseReward: 100,
  spawnDelay: 0,
  modelConfig: { ...SPIDER_MODEL, scale: 0.05 }, // Босс больше
};

// ============================================
// КОНФИГУРАЦИЯ УРОВНЕЙ
// Каждый уровень использует базовые типы врагов с модификаторами HP и скорости
// ============================================

// Функция для создания врага с модификаторами
function createEnemy(
  baseEnemy: EnemyClass,
  healthMult: number = 1,
  speedMult: number = 1
): EnemyClass {
  return {
    ...baseEnemy,
    baseHealth: Math.round(baseEnemy.baseHealth * healthMult),
    baseSpeed: Math.round(baseEnemy.baseSpeed * speedMult),
    // Глубокое копирование конфигурации модели для избежания мутаций
    modelConfig: {
      ...baseEnemy.modelConfig,
      animations: {
        walk: { ...baseEnemy.modelConfig.animations.walk },
        death: { ...baseEnemy.modelConfig.animations.death },
      },
    },
  };
}

// Уровень 1 - Обучение (только легкая пехота и 1 легкий танк)
export const LEVEL_1_ENEMIES: EnemyClass[] = [
  createEnemy(SCOUT, 1.0, 1.0),
  createEnemy(SOLDIER, 1.0, 1.0),
  createEnemy(VETERAN, 1.0, 1.0),
  createEnemy(COMMANDO, 1.0, 1.0),
  createEnemy(LIGHT_TANK, 1.5, 0.8),
];

// Уровень 2 - Пехота + легкие танки
export const LEVEL_2_ENEMIES: EnemyClass[] = [
  createEnemy(SCOUT, 1.5, 1.1),
  createEnemy(SOLDIER, 1.5, 1.1),
  createEnemy(VETERAN, 1.5, 1.0),
  createEnemy(COMMANDO, 1.5, 1.1),
  createEnemy(HEAVY_INFANTRY, 1.5, 1.0),
  createEnemy(LIGHT_TANK, 2.0, 1.0),
  createEnemy(FAST_TANK, 1.8, 1.1),
];

// Уровень 3 - Баланс: пехота + легкие и средние танки
export const LEVEL_3_ENEMIES: EnemyClass[] = [
  createEnemy(COMMANDO, 2.0, 1.2),
  createEnemy(HEAVY_INFANTRY, 2.0, 1.1),
  createEnemy(LIGHT_TANK, 2.5, 1.1),
  createEnemy(FAST_TANK, 2.2, 1.2),
  createEnemy(ARMORED_TRANSPORT, 2.5, 1.0),
  createEnemy(MEDIUM_TANK, 1.5, 1.0),
  createEnemy(ASSAULT_TANK, 1.4, 1.1),
];

// Уровень 4 - Больше средних танков
export const LEVEL_4_ENEMIES: EnemyClass[] = [
  createEnemy(HEAVY_INFANTRY, 2.5, 1.2),
  createEnemy(ARMORED_TRANSPORT, 3.0, 1.1),
  createEnemy(FAST_TANK, 2.8, 1.3),
  createEnemy(MEDIUM_TANK, 2.0, 1.1),
  createEnemy(BATTLE_TANK, 1.8, 1.0),
  createEnemy(ASSAULT_TANK, 1.8, 1.2),
  createEnemy(SIEGE_TANK, 1.8, 1.0),
];

// Уровень 5 - Средние и первые тяжелые танки
export const LEVEL_5_ENEMIES: EnemyClass[] = [
  createEnemy(ARMORED_TRANSPORT, 3.5, 1.2),
  createEnemy(MEDIUM_TANK, 2.5, 1.2),
  createEnemy(BATTLE_TANK, 2.2, 1.1),
  createEnemy(ASSAULT_TANK, 2.2, 1.3),
  createEnemy(SIEGE_TANK, 2.5, 1.0),
  createEnemy(HEAVY_TANK, 1.5, 1.0),
];

// Уровень 6 - Только танки: легкие, средние, тяжелые
export const LEVEL_6_ENEMIES: EnemyClass[] = [
  createEnemy(FAST_TANK, 4.0, 1.4),
  createEnemy(ARMORED_TRANSPORT, 4.0, 1.3),
  createEnemy(MEDIUM_TANK, 3.0, 1.3),
  createEnemy(BATTLE_TANK, 2.8, 1.2),
  createEnemy(ASSAULT_TANK, 2.8, 1.4),
  createEnemy(SIEGE_TANK, 3.2, 1.1),
  createEnemy(HEAVY_TANK, 2.0, 1.1),
  createEnemy(BEHEMOTH, 1.8, 1.0),
];

// Уровень 7 - Больше тяжелых танков
export const LEVEL_7_ENEMIES: EnemyClass[] = [
  createEnemy(FAST_TANK, 5.0, 1.5),
  createEnemy(BATTLE_TANK, 3.5, 1.3),
  createEnemy(ASSAULT_TANK, 3.5, 1.5),
  createEnemy(SIEGE_TANK, 4.0, 1.2),
  createEnemy(HEAVY_TANK, 2.5, 1.2),
  createEnemy(BEHEMOTH, 2.2, 1.1),
  createEnemy(JUGGERNAUT, 1.8, 1.0),
];

// Уровень 8 - Усиленные тяжелые танки
export const LEVEL_8_ENEMIES: EnemyClass[] = [
  createEnemy(FAST_TANK, 6.0, 1.6),
  createEnemy(ASSAULT_TANK, 4.5, 1.6),
  createEnemy(SIEGE_TANK, 5.0, 1.3),
  createEnemy(HEAVY_TANK, 3.0, 1.3),
  createEnemy(BEHEMOTH, 2.8, 1.2),
  createEnemy(JUGGERNAUT, 2.3, 1.1),
];

// Уровень 9 - Максимальная сложность танков
export const LEVEL_9_ENEMIES: EnemyClass[] = [
  createEnemy(FAST_TANK, 7.0, 1.7),
  createEnemy(ASSAULT_TANK, 5.5, 1.7),
  createEnemy(SIEGE_TANK, 6.0, 1.4),
  createEnemy(HEAVY_TANK, 3.5, 1.4),
  createEnemy(BEHEMOTH, 3.5, 1.3),
  createEnemy(JUGGERNAUT, 3.0, 1.2),
];

// Уровень 10 - Финал + БОСС
export const LEVEL_10_ENEMIES: EnemyClass[] = [
  createEnemy(FAST_TANK, 8.0, 1.8),
  createEnemy(ASSAULT_TANK, 6.5, 1.8),
  createEnemy(SIEGE_TANK, 7.0, 1.5),
  createEnemy(HEAVY_TANK, 4.0, 1.5),
  createEnemy(BEHEMOTH, 4.5, 1.4),
  createEnemy(JUGGERNAUT, 4.0, 1.3),
  BOSS, // Босс без модификаторов
];

// Экспорт всех классов врагов по уровням
export const ENEMY_CLASSES_BY_LEVEL: Record<number, EnemyClass[]> = {
  1: LEVEL_1_ENEMIES,
  2: LEVEL_2_ENEMIES,
  3: LEVEL_3_ENEMIES,
  4: LEVEL_4_ENEMIES,
  5: LEVEL_5_ENEMIES,
  6: LEVEL_6_ENEMIES,
  7: LEVEL_7_ENEMIES,
  8: LEVEL_8_ENEMIES,
  9: LEVEL_9_ENEMIES,
  10: LEVEL_10_ENEMIES,
};
