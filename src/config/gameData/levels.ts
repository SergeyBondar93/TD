import type { LevelConfig, WaveConfig } from '../../types/game';
import { ENEMY_CLASSES_BY_LEVEL, type EnemyClass } from './enemies';

// Функция для создания волны из класса врага
function createWave(enemyClass: EnemyClass, count: number, level: number): WaveConfig {
  return {
    enemyCount: count,
    enemyLevel: level,
    enemyHealth: enemyClass.baseHealth,
    enemySpeed: enemyClass.baseSpeed,
    enemyReward: enemyClass.baseReward,
    spawnDelay: enemyClass.spawnDelay,
    enemyType: enemyClass.type,
    modelConfig: enemyClass.modelConfig, // Передаем конфиг модели
  };
}

// Создаём 10 уровней сложности с прогрессивным увеличением сложности
export const LEVELS: LevelConfig[] = [
  // Уровень 1 - Обучение (только пехота)
  {
    level: 1,
    startingMoney: 300,
    startingLives: 20,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[1][0], 50, 1), // Разведчик
      createWave(ENEMY_CLASSES_BY_LEVEL[1][1], 45, 1), // Солдат
      createWave(ENEMY_CLASSES_BY_LEVEL[1][2], 40, 1), // Ветеран
      createWave(ENEMY_CLASSES_BY_LEVEL[1][3], 35, 1), // Коммандо
      createWave(ENEMY_CLASSES_BY_LEVEL[1][4], 20, 1), // Легкий танк
    ],
  },
  // Уровень 2 (пехота + легкие танки)
  {
    level: 2,
    startingMoney: 35,
    startingLives: 20,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[2][0], 50, 2), // Разведчик
      createWave(ENEMY_CLASSES_BY_LEVEL[2][1], 45, 2), // Солдат
      createWave(ENEMY_CLASSES_BY_LEVEL[2][2], 40, 2), // Ветеран
      createWave(ENEMY_CLASSES_BY_LEVEL[2][3], 35, 2), // Коммандо
      createWave(ENEMY_CLASSES_BY_LEVEL[2][4], 30, 2), // Тяжелая пехота
      createWave(ENEMY_CLASSES_BY_LEVEL[2][5], 25, 2), // Легкий танк
      createWave(ENEMY_CLASSES_BY_LEVEL[2][6], 20, 2), // Скоростной танк
    ],
  },
  // Уровень 3 (баланс пехоты и танков)
  {
    level: 3,
    startingMoney: 40,
    startingLives: 18,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[3][0], 40, 3), // Коммандо
      createWave(ENEMY_CLASSES_BY_LEVEL[3][1], 35, 3), // Тяжелая пехота
      createWave(ENEMY_CLASSES_BY_LEVEL[3][2], 30, 3), // Легкий танк
      createWave(ENEMY_CLASSES_BY_LEVEL[3][3], 25, 3), // Скоростной танк
      createWave(ENEMY_CLASSES_BY_LEVEL[3][4], 22, 3), // Бронетранспортер
      createWave(ENEMY_CLASSES_BY_LEVEL[3][5], 20, 3), // Средний танк
      createWave(ENEMY_CLASSES_BY_LEVEL[3][6], 18, 3), // Штурмовой танк
    ],
  },
  // Уровень 4 (больше средних танков)
  {
    level: 4,
    startingMoney: 45,
    startingLives: 18,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[4][0], 35, 4), // Тяжелая пехота
      createWave(ENEMY_CLASSES_BY_LEVEL[4][1], 30, 4), // Бронетранспортер
      createWave(ENEMY_CLASSES_BY_LEVEL[4][2], 28, 4), // Скоростной танк
      createWave(ENEMY_CLASSES_BY_LEVEL[4][3], 25, 4), // Средний танк
      createWave(ENEMY_CLASSES_BY_LEVEL[4][4], 22, 4), // Боевой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[4][5], 20, 4), // Штурмовой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[4][6], 18, 4), // Осадный танк
    ],
  },
  // Уровень 5 (средние и тяжелые танки)
  {
    level: 5,
    startingMoney: 50,
    startingLives: 15,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[5][0], 30, 5), // Бронетранспортер
      createWave(ENEMY_CLASSES_BY_LEVEL[5][1], 28, 5), // Средний танк
      createWave(ENEMY_CLASSES_BY_LEVEL[5][2], 25, 5), // Боевой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[5][3], 22, 5), // Штурмовой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[5][4], 20, 5), // Осадный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[5][5], 15, 5), // Тяжелый танк
    ],
  },
  // Уровень 6 (только танки)
  {
    level: 6,
    startingMoney: 55,
    startingLives: 15,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[6][0], 30, 6), // Скоростной танк
      createWave(ENEMY_CLASSES_BY_LEVEL[6][1], 28, 6), // Бронетранспортер
      createWave(ENEMY_CLASSES_BY_LEVEL[6][2], 25, 6), // Средний танк
      createWave(ENEMY_CLASSES_BY_LEVEL[6][3], 22, 6), // Боевой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[6][4], 20, 6), // Штурмовой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[6][5], 18, 6), // Осадный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[6][6], 16, 6), // Тяжелый танк
      createWave(ENEMY_CLASSES_BY_LEVEL[6][7], 14, 6), // Бегемот
    ],
  },
  // Уровень 7 (больше тяжелых танков)
  {
    level: 7,
    startingMoney: 60,
    startingLives: 12,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[7][0], 28, 7), // Скоростной танк
      createWave(ENEMY_CLASSES_BY_LEVEL[7][1], 25, 7), // Боевой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[7][2], 22, 7), // Штурмовой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[7][3], 20, 7), // Осадный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[7][4], 18, 7), // Тяжелый танк
      createWave(ENEMY_CLASSES_BY_LEVEL[7][5], 15, 7), // Бегемот
      createWave(ENEMY_CLASSES_BY_LEVEL[7][6], 12, 7), // Джаггернаут
    ],
  },
  // Уровень 8 (усиленные тяжелые танки)
  {
    level: 8,
    startingMoney: 65,
    startingLives: 12,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[8][0], 25, 8), // Скоростной танк
      createWave(ENEMY_CLASSES_BY_LEVEL[8][1], 22, 8), // Штурмовой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[8][2], 20, 8), // Осадный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[8][3], 18, 8), // Тяжелый танк
      createWave(ENEMY_CLASSES_BY_LEVEL[8][4], 15, 8), // Бегемот
      createWave(ENEMY_CLASSES_BY_LEVEL[8][5], 12, 8), // Джаггернаут
    ],
  },
  // Уровень 9 (максимальная сложность)
  {
    level: 9,
    startingMoney: 70,
    startingLives: 10,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[9][0], 25, 9), // Скоростной танк
      createWave(ENEMY_CLASSES_BY_LEVEL[9][1], 22, 9), // Штурмовой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[9][2], 20, 9), // Осадный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[9][3], 18, 9), // Тяжелый танк
      createWave(ENEMY_CLASSES_BY_LEVEL[9][4], 15, 9), // Бегемот
      createWave(ENEMY_CLASSES_BY_LEVEL[9][5], 12, 9), // Джаггернаут
    ],
  },
  // Уровень 10 - Финальный уровень + БОСС
  {
    level: 10,
    startingMoney: 7500,
    startingLives: 10,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[10][0], 25, 10), // Скоростной танк
      createWave(ENEMY_CLASSES_BY_LEVEL[10][1], 22, 10), // Штурмовой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[10][2], 20, 10), // Осадный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[10][3], 18, 10), // Тяжелый танк
      createWave(ENEMY_CLASSES_BY_LEVEL[10][4], 15, 10), // Бегемот
      createWave(ENEMY_CLASSES_BY_LEVEL[10][5], 12, 10), // Джаггернаут
      createWave(ENEMY_CLASSES_BY_LEVEL[10][6], 1, 10),  // БОСС
    ],
  },
];

// Путь для врагов (зигзагообразный) - с учетом паддинга
const PADDING = 30;
export const DEFAULT_PATH = [
  { x: PADDING, y: 100 + PADDING },
  { x: 200 + PADDING, y: 100 + PADDING },
  { x: 200 + PADDING, y: 300 + PADDING },
  { x: 500 + PADDING, y: 300 + PADDING },
  { x: 500 + PADDING, y: 100 + PADDING },
  { x: 700 + PADDING, y: 100 + PADDING },
  { x: 700 + PADDING, y: 500 + PADDING },
  { x: 770 + PADDING, y: 500 + PADDING },
];
