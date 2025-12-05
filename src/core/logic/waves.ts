import type { Tower, WaveConfig, Enemy, Position } from "../../types/game";
import { ENEMY_SIZES } from "../../types/game";
import { TOWER_STATS } from "../../config/gameData/towers";
import { GAME_SETTINGS } from "../../config/settings";
import { lerpAngle, generateId } from "./math";

/**
 * Логика башен - обновление поворотов и улучшений
 */

export function updateTowerRotations(
  towers: Tower[],
  deltaTime: number,
  rotationSpeed: number = GAME_SETTINGS.TOWER_ROTATION_SPEED
): Tower[] {
  return towers.map((tower) => {
    const currentRotation = tower.rotation ?? 0;
    const targetRotation = tower.targetRotation ?? currentRotation;

    // Плавно поворачиваем к целевому углу
    const newRotation = lerpAngle(
      currentRotation,
      targetRotation,
      rotationSpeed,
      deltaTime
    );

    // Обновляем время строительства/улучшения
    let updatedTower = {
      ...tower,
      rotation: newRotation,
      buildTimeRemaining: Math.max(0, tower.buildTimeRemaining - deltaTime),
    };

    // Если завершилось улучшение, применяем его
    if (
      tower.buildTimeRemaining > 0 &&
      updatedTower.buildTimeRemaining === 0 &&
      tower.upgradeQueue > 0
    ) {
      const newUpgradeLevel = tower.upgradeLevel + tower.upgradeQueue;
      const towerStats = TOWER_STATS[tower.level][newUpgradeLevel];

      if (towerStats) {
        updatedTower = {
          ...updatedTower,
          upgradeLevel: newUpgradeLevel,
          damage: towerStats.damage,
          range: towerStats.range,
          fireRate: towerStats.fireRate,
          upgradeQueue: 0,
        };
      }
    }

    return updatedTower;
  });
}

/**
 * Логика волн врагов
 */

export interface WaveSpawnState {
  waveIndex: number;
  enemiesSpawned: number;
  lastSpawnTime: number;
}

export interface SpawnResult {
  newEnemy: Enemy | null;
  updatedSpawnState: WaveSpawnState | null;
}

export function processWaveSpawn(
  spawnState: WaveSpawnState | null,
  waveConfig: WaveConfig,
  currentTime: number,
  startPosition: Position
): SpawnResult {
  if (!spawnState) {
    return { newEnemy: null, updatedSpawnState: null };
  }

  const timeSinceLastSpawn = currentTime - spawnState.lastSpawnTime;

  if (
    spawnState.enemiesSpawned < waveConfig.enemyCount &&
    timeSinceLastSpawn >= waveConfig.spawnDelay
  ) {
    // Определяем размер врага в зависимости от типа
    const enemySize = ENEMY_SIZES[waveConfig.enemyType];

    // Для пехоты добавляем случайное смещение (перпендикулярно и вдоль пути)
    let spawnPosition = { ...startPosition };
    let pathOffset = 0;

    if (waveConfig.enemyType === "infantry") {
      // Смещение для создания эффекта толпы
      pathOffset =
        (Math.random() - 0.5) * GAME_SETTINGS.INFANTRY_PATH_OFFSET_RANGE;
      // Смещение применяется как перпендикулярно, так и вдоль направления движения
      spawnPosition.x += pathOffset;
      spawnPosition.y += pathOffset;
    }
    const newEnemy: Enemy = {
      id: generateId(),
      position: spawnPosition,
      health: waveConfig.enemyHealth,
      maxHealth: waveConfig.enemyHealth,
      speed: waveConfig.enemySpeed,
      level: waveConfig.enemyLevel,
      pathIndex: 0,
      reward: waveConfig.enemyReward,
      type: waveConfig.enemyType,
      size: enemySize,
      pathOffset: pathOffset,
      turnPoints: [],
      modelConfig: waveConfig.modelConfig,
    };

    const updatedSpawnState: WaveSpawnState = {
      ...spawnState,
      enemiesSpawned: spawnState.enemiesSpawned + 1,
      lastSpawnTime: currentTime,
    };

    // Если все враги заспавнились, возвращаем null
    const finalSpawnState =
      updatedSpawnState.enemiesSpawned >= waveConfig.enemyCount
        ? null
        : updatedSpawnState;

    return { newEnemy, updatedSpawnState: finalSpawnState };
  }

  return { newEnemy: null, updatedSpawnState: spawnState };
}
