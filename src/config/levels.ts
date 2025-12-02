import type { LevelConfig, WaveConfig } from '../types/game';
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
  };
}

// Создаём 10 уровней сложности с прогрессивным увеличением сложности
export const LEVELS: LevelConfig[] = [
  // Уровень 1 - Обучение (только пехота)
  {
    level: 1,
    startingMoney: 3000,
    startingLives: 20,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[1][0], 50, 1), // Рекрут
      createWave(ENEMY_CLASSES_BY_LEVEL[1][1], 40, 1), // Солдат
      createWave(ENEMY_CLASSES_BY_LEVEL[1][2], 45, 1), // Разведчик
      createWave(ENEMY_CLASSES_BY_LEVEL[1][3], 35, 1), // Ветеран
      createWave(ENEMY_CLASSES_BY_LEVEL[1][4], 15, 1), // Легкий транспорт
    ],
  },
  // Уровень 2 (больше пехоты, появляются танки)
  {
    level: 2,
    startingMoney: 350,
    startingLives: 20,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[2][0], 50, 2), // Штурмовик
      createWave(ENEMY_CLASSES_BY_LEVEL[2][1], 45, 2), // Гренадер
      createWave(ENEMY_CLASSES_BY_LEVEL[2][2], 55, 2), // Коммандос
      createWave(ENEMY_CLASSES_BY_LEVEL[2][3], 40, 2), // Элитный боец
      createWave(ENEMY_CLASSES_BY_LEVEL[2][4], 20, 2), // Бронетранспортер
      createWave(ENEMY_CLASSES_BY_LEVEL[2][5], 18, 2), // Разведывательный танк
    ],
  },
  // Уровень 3 (баланс пехоты и танков)
  {
    level: 3,
    startingMoney: 400,
    startingLives: 18,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[3][0], 45, 3), // Тяжелая пехота
      createWave(ENEMY_CLASSES_BY_LEVEL[3][1], 40, 3), // Штурмовая группа
      createWave(ENEMY_CLASSES_BY_LEVEL[3][2], 25, 3), // Легкий танк
      createWave(ENEMY_CLASSES_BY_LEVEL[3][3], 22, 3), // Средний танк
      createWave(ENEMY_CLASSES_BY_LEVEL[3][4], 20, 3), // Штурмовой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[3][5], 18, 3), // Бронированный транспорт
      createWave(ENEMY_CLASSES_BY_LEVEL[3][6], 35, 3), // Специальный отряд
    ],
  },
  // Уровень 4 (больше танков)
  {
    level: 4,
    startingMoney: 450,
    startingLives: 18,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[4][0], 40, 4), // Ударная группа
      createWave(ENEMY_CLASSES_BY_LEVEL[4][1], 35, 4), // Быстрый отряд
      createWave(ENEMY_CLASSES_BY_LEVEL[4][2], 25, 4), // Усиленный легкий танк
      createWave(ENEMY_CLASSES_BY_LEVEL[4][3], 24, 4), // Боевой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[4][4], 22, 4), // Осадный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[4][5], 20, 4), // Скоростной танк
      createWave(ENEMY_CLASSES_BY_LEVEL[4][6], 18, 4), // Тяжелый танк
      createWave(ENEMY_CLASSES_BY_LEVEL[4][7], 30, 4), // Элитный десант
    ],
  },
  // Уровень 5 (еще больше танков)
  {
    level: 5,
    startingMoney: 500,
    startingLives: 15,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[5][0], 35, 5), // Отряд спецназа
      createWave(ENEMY_CLASSES_BY_LEVEL[5][1], 30, 5), // Бронированная пехота
      createWave(ENEMY_CLASSES_BY_LEVEL[5][2], 25, 5), // Продвинутый средний танк
      createWave(ENEMY_CLASSES_BY_LEVEL[5][3], 22, 5), // Маневренный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[5][4], 20, 5), // Супертяжелый танк
      createWave(ENEMY_CLASSES_BY_LEVEL[5][5], 18, 5), // Боевой Мастодонт
      createWave(ENEMY_CLASSES_BY_LEVEL[5][6], 16, 5), // Штурмовой колосс
      createWave(ENEMY_CLASSES_BY_LEVEL[5][7], 20, 5), // Ураганный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[5][8], 28, 5), // Молниеносный отряд
    ],
  },
  // Уровень 6 (только танки)
  {
    level: 6,
    startingMoney: 550,
    startingLives: 15,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[6][0], 30, 6), // Штурмовой раннер
      createWave(ENEMY_CLASSES_BY_LEVEL[6][1], 28, 6), // Быстрый перехватчик
      createWave(ENEMY_CLASSES_BY_LEVEL[6][2], 25, 6), // Усиленный боевой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[6][3], 22, 6), // Огневая поддержка
      createWave(ENEMY_CLASSES_BY_LEVEL[6][4], 24, 6), // Скоростной крейсер
      createWave(ENEMY_CLASSES_BY_LEVEL[6][5], 20, 6), // Тяжелый разрушитель
      createWave(ENEMY_CLASSES_BY_LEVEL[6][6], 18, 6), // Бронированный бегемот
      createWave(ENEMY_CLASSES_BY_LEVEL[6][7], 16, 6), // Железная крепость
      createWave(ENEMY_CLASSES_BY_LEVEL[6][8], 19, 6), // Стальной титан
      createWave(ENEMY_CLASSES_BY_LEVEL[6][9], 15, 6), // Мобильный бункер
      createWave(ENEMY_CLASSES_BY_LEVEL[6][10], 22, 6), // Ударная волна
      createWave(ENEMY_CLASSES_BY_LEVEL[6][11], 26, 6), // Молниеносный танк
    ],
  },
  // Уровень 7 (только танки)
  {
    level: 7,
    startingMoney: 600,
    startingLives: 12,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[7][0], 28, 7), // Легкий разведчик
      createWave(ENEMY_CLASSES_BY_LEVEL[7][1], 26, 7), // Скоростной налетчик
      createWave(ENEMY_CLASSES_BY_LEVEL[7][2], 24, 7), // Модернизированный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[7][3], 22, 7), // Боевой страж
      createWave(ENEMY_CLASSES_BY_LEVEL[7][4], 23, 7), // Огненный дракон
      createWave(ENEMY_CLASSES_BY_LEVEL[7][5], 21, 7), // Штурмовой авангард
      createWave(ENEMY_CLASSES_BY_LEVEL[7][6], 18, 7), // Супертяжелый гладиатор
      createWave(ENEMY_CLASSES_BY_LEVEL[7][7], 16, 7), // Железный левиафан
      createWave(ENEMY_CLASSES_BY_LEVEL[7][8], 17, 7), // Бронированный колосс
      createWave(ENEMY_CLASSES_BY_LEVEL[7][9], 19, 7), // Стальной монолит
      createWave(ENEMY_CLASSES_BY_LEVEL[7][10], 14, 7), // Мега-разрушитель
      createWave(ENEMY_CLASSES_BY_LEVEL[7][11], 15, 7), // Неудержимый джаггернаут
      createWave(ENEMY_CLASSES_BY_LEVEL[7][12], 20, 7), // Плазменный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[7][13], 25, 7), // Ураганный рейдер
    ],
  },
  // Уровень 8 (только танки)
  {
    level: 8,
    startingMoney: 650,
    startingLives: 12,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[8][0], 26, 8), // Элитный разведчик
      createWave(ENEMY_CLASSES_BY_LEVEL[8][1], 24, 8), // Молниеносный штурмовик
      createWave(ENEMY_CLASSES_BY_LEVEL[8][2], 25, 8), // Быстрая атака
      createWave(ENEMY_CLASSES_BY_LEVEL[8][3], 22, 8), // Продвинутый боевой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[8][4], 21, 8), // Тяжелый крейсер
      createWave(ENEMY_CLASSES_BY_LEVEL[8][5], 20, 8), // Ионный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[8][6], 23, 8), // Энергетический страж
      createWave(ENEMY_CLASSES_BY_LEVEL[8][7], 19, 8), // Огненный ураган
      createWave(ENEMY_CLASSES_BY_LEVEL[8][8], 17, 8), // Супермассивный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[8][9], 16, 8), // Титанический разрушитель
      createWave(ENEMY_CLASSES_BY_LEVEL[8][10], 18, 8), // Кибернетический колосс
      createWave(ENEMY_CLASSES_BY_LEVEL[8][11], 14, 8), // Плазменный бегемот
      createWave(ENEMY_CLASSES_BY_LEVEL[8][12], 15, 8), // Ядерный титан
      createWave(ENEMY_CLASSES_BY_LEVEL[8][13], 13, 8), // Мега-джаггернаут
      createWave(ENEMY_CLASSES_BY_LEVEL[8][14], 16, 8), // Неразрушимый страж
      createWave(ENEMY_CLASSES_BY_LEVEL[8][15], 20, 8), // Квантовый воин
    ],
  },
  // Уровень 9 (только танки)
  {
    level: 9,
    startingMoney: 700,
    startingLives: 10,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[9][0], 24, 9), // Гипер-разведчик
      createWave(ENEMY_CLASSES_BY_LEVEL[9][1], 22, 9), // Квантовый перехватчик
      createWave(ENEMY_CLASSES_BY_LEVEL[9][2], 23, 9), // Суперскоростной рейдер
      createWave(ENEMY_CLASSES_BY_LEVEL[9][3], 20, 9), // Элитный боевой танк
      createWave(ENEMY_CLASSES_BY_LEVEL[9][4], 19, 9), // Кибер-крейсер
      createWave(ENEMY_CLASSES_BY_LEVEL[9][5], 21, 9), // Нейронный штурмовик
      createWave(ENEMY_CLASSES_BY_LEVEL[9][6], 18, 9), // Темная материя
      createWave(ENEMY_CLASSES_BY_LEVEL[9][7], 20, 9), // Антиматерия
      createWave(ENEMY_CLASSES_BY_LEVEL[9][8], 17, 9), // Плазменный вихрь
      createWave(ENEMY_CLASSES_BY_LEVEL[9][9], 15, 9), // Ультра-массивный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[9][10], 14, 9), // Апокалиптический бегемот
      createWave(ENEMY_CLASSES_BY_LEVEL[9][11], 16, 9), // Омега-разрушитель
      createWave(ENEMY_CLASSES_BY_LEVEL[9][12], 13, 9), // Кибер-левиафан
      createWave(ENEMY_CLASSES_BY_LEVEL[9][13], 14, 9), // Гипер-колосс
      createWave(ENEMY_CLASSES_BY_LEVEL[9][14], 12, 9), // Финальный страж
      createWave(ENEMY_CLASSES_BY_LEVEL[9][15], 13, 9), // Нано-титан
      createWave(ENEMY_CLASSES_BY_LEVEL[9][16], 11, 9), // Экстремальный джаггернаут
      createWave(ENEMY_CLASSES_BY_LEVEL[9][17], 12, 9), // Абсолютная крепость
    ],
  },
  // Уровень 10 - Финальный уровень + БОСС
  {
    level: 10,
    startingMoney: 750,
    startingLives: 10,
    waves: [
      createWave(ENEMY_CLASSES_BY_LEVEL[10][0], 22, 10), // Финальный разведчик
      createWave(ENEMY_CLASSES_BY_LEVEL[10][1], 20, 10), // Абсолютный рейдер
      createWave(ENEMY_CLASSES_BY_LEVEL[10][2], 21, 10), // Предельная скорость
      createWave(ENEMY_CLASSES_BY_LEVEL[10][3], 18, 10), // Легендарный танк
      createWave(ENEMY_CLASSES_BY_LEVEL[10][4], 17, 10), // Мифический воин
      createWave(ENEMY_CLASSES_BY_LEVEL[10][5], 19, 10), // Божественный страж
      createWave(ENEMY_CLASSES_BY_LEVEL[10][6], 16, 10), // Хаос-генератор
      createWave(ENEMY_CLASSES_BY_LEVEL[10][7], 18, 10), // Вихрь разрушения
      createWave(ENEMY_CLASSES_BY_LEVEL[10][8], 15, 10), // Энергия вечности
      createWave(ENEMY_CLASSES_BY_LEVEL[10][9], 14, 10), // Максимальный разрушитель
      createWave(ENEMY_CLASSES_BY_LEVEL[10][10], 13, 10), // Предельный бегемот
      createWave(ENEMY_CLASSES_BY_LEVEL[10][11], 14, 10), // Судный день
      createWave(ENEMY_CLASSES_BY_LEVEL[10][12], 12, 10), // Армагеддон
      createWave(ENEMY_CLASSES_BY_LEVEL[10][13], 13, 10), // Апокалипсис
      createWave(ENEMY_CLASSES_BY_LEVEL[10][14], 11, 10), // Вечный колосс
      createWave(ENEMY_CLASSES_BY_LEVEL[10][15], 12, 10), // Бесконечный титан
      createWave(ENEMY_CLASSES_BY_LEVEL[10][16], 10, 10), // Космический левиафан
      createWave(ENEMY_CLASSES_BY_LEVEL[10][17], 11, 10), // Непобедимый страж
      createWave(ENEMY_CLASSES_BY_LEVEL[10][18], 10, 10), // Легенда разрушения
      createWave(ENEMY_CLASSES_BY_LEVEL[10][19], 1, 10),  // ИМПЕРАТОР РАЗРУШЕНИЯ (БОСС)
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
