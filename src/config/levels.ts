import type { LevelConfig } from '../types/game';

// Создаём 10 уровней сложности с прогрессивным увеличением сложности
export const LEVELS: LevelConfig[] = [
  // Уровень 1 - Обучение
  {
    level: 1,
    startingMoney: 300,
    startingLives: 20,
    waves: [
      {
        enemyCount: 5,
        enemyLevel: 1,
        enemyHealth: 50,
        enemySpeed: 50,
        enemyReward: 20,
        spawnDelay: 2000,
      },
      {
        enemyCount: 8,
        enemyLevel: 1,
        enemyHealth: 60,
        enemySpeed: 55,
        enemyReward: 25,
        spawnDelay: 1800,
      },
    ],
  },
  // Уровень 2
  {
    level: 2,
    startingMoney: 350,
    startingLives: 20,
    waves: [
      {
        enemyCount: 10,
        enemyLevel: 2,
        enemyHealth: 80,
        enemySpeed: 60,
        enemyReward: 30,
        spawnDelay: 1700,
      },
      {
        enemyCount: 12,
        enemyLevel: 2,
        enemyHealth: 100,
        enemySpeed: 65,
        enemyReward: 35,
        spawnDelay: 1500,
      },
    ],
  },
  // Уровень 3
  {
    level: 3,
    startingMoney: 400,
    startingLives: 18,
    waves: [
      {
        enemyCount: 15,
        enemyLevel: 3,
        enemyHealth: 120,
        enemySpeed: 70,
        enemyReward: 40,
        spawnDelay: 1400,
      },
      {
        enemyCount: 18,
        enemyLevel: 3,
        enemyHealth: 140,
        enemySpeed: 75,
        enemyReward: 45,
        spawnDelay: 1300,
      },
      {
        enemyCount: 10,
        enemyLevel: 4,
        enemyHealth: 180,
        enemySpeed: 80,
        enemyReward: 55,
        spawnDelay: 1200,
      },
    ],
  },
  // Уровень 4
  {
    level: 4,
    startingMoney: 450,
    startingLives: 18,
    waves: [
      {
        enemyCount: 20,
        enemyLevel: 4,
        enemyHealth: 200,
        enemySpeed: 85,
        enemyReward: 50,
        spawnDelay: 1200,
      },
      {
        enemyCount: 15,
        enemyLevel: 5,
        enemyHealth: 250,
        enemySpeed: 90,
        enemyReward: 60,
        spawnDelay: 1100,
      },
    ],
  },
  // Уровень 5
  {
    level: 5,
    startingMoney: 500,
    startingLives: 15,
    waves: [
      {
        enemyCount: 25,
        enemyLevel: 5,
        enemyHealth: 280,
        enemySpeed: 95,
        enemyReward: 65,
        spawnDelay: 1000,
      },
      {
        enemyCount: 20,
        enemyLevel: 6,
        enemyHealth: 320,
        enemySpeed: 100,
        enemyReward: 70,
        spawnDelay: 1000,
      },
      {
        enemyCount: 15,
        enemyLevel: 6,
        enemyHealth: 350,
        enemySpeed: 105,
        enemyReward: 75,
        spawnDelay: 900,
      },
    ],
  },
  // Уровень 6
  {
    level: 6,
    startingMoney: 550,
    startingLives: 15,
    waves: [
      {
        enemyCount: 30,
        enemyLevel: 6,
        enemyHealth: 380,
        enemySpeed: 110,
        enemyReward: 80,
        spawnDelay: 900,
      },
      {
        enemyCount: 25,
        enemyLevel: 7,
        enemyHealth: 420,
        enemySpeed: 115,
        enemyReward: 85,
        spawnDelay: 800,
      },
    ],
  },
  // Уровень 7
  {
    level: 7,
    startingMoney: 600,
    startingLives: 12,
    waves: [
      {
        enemyCount: 35,
        enemyLevel: 7,
        enemyHealth: 450,
        enemySpeed: 120,
        enemyReward: 90,
        spawnDelay: 800,
      },
      {
        enemyCount: 30,
        enemyLevel: 8,
        enemyHealth: 500,
        enemySpeed: 125,
        enemyReward: 95,
        spawnDelay: 750,
      },
      {
        enemyCount: 20,
        enemyLevel: 8,
        enemyHealth: 550,
        enemySpeed: 130,
        enemyReward: 100,
        spawnDelay: 700,
      },
    ],
  },
  // Уровень 8
  {
    level: 8,
    startingMoney: 650,
    startingLives: 12,
    waves: [
      {
        enemyCount: 40,
        enemyLevel: 8,
        enemyHealth: 600,
        enemySpeed: 135,
        enemyReward: 105,
        spawnDelay: 700,
      },
      {
        enemyCount: 35,
        enemyLevel: 9,
        enemyHealth: 650,
        enemySpeed: 140,
        enemyReward: 110,
        spawnDelay: 650,
      },
    ],
  },
  // Уровень 9
  {
    level: 9,
    startingMoney: 700,
    startingLives: 10,
    waves: [
      {
        enemyCount: 45,
        enemyLevel: 9,
        enemyHealth: 700,
        enemySpeed: 145,
        enemyReward: 115,
        spawnDelay: 650,
      },
      {
        enemyCount: 40,
        enemyLevel: 10,
        enemyHealth: 800,
        enemySpeed: 150,
        enemyReward: 120,
        spawnDelay: 600,
      },
      {
        enemyCount: 30,
        enemyLevel: 10,
        enemyHealth: 900,
        enemySpeed: 155,
        enemyReward: 130,
        spawnDelay: 550,
      },
    ],
  },
  // Уровень 10 - Финальный босс
  {
    level: 10,
    startingMoney: 750,
    startingLives: 10,
    waves: [
      {
        enemyCount: 50,
        enemyLevel: 10,
        enemyHealth: 1000,
        enemySpeed: 160,
        enemyReward: 140,
        spawnDelay: 500,
      },
      {
        enemyCount: 45,
        enemyLevel: 10,
        enemyHealth: 1200,
        enemySpeed: 165,
        enemyReward: 150,
        spawnDelay: 500,
      },
      {
        enemyCount: 30,
        enemyLevel: 10,
        enemyHealth: 1500,
        enemySpeed: 170,
        enemyReward: 200,
        spawnDelay: 450,
      },
      {
        enemyCount: 1,
        enemyLevel: 10,
        enemyHealth: 5000,
        enemySpeed: 50,
        enemyReward: 500,
        spawnDelay: 0,
      },
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
